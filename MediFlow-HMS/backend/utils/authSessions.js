import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import authSessionModel from '../models/authSessionModel.js';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const AUTH_ROLES = ['user', 'doctor', 'staff', 'admin'];

const durationMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};

const parseDurationToMs = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const normalizedValue = String(value || '').trim();
    const durationMatch = normalizedValue.match(/^(\d+)([smhd])$/i);

    if (!durationMatch) {
        throw new Error(`Unsupported duration format: ${value}`);
    }

    const [, amount, unit] = durationMatch;
    return Number(amount) * durationMap[unit.toLowerCase()];
};

const ACCESS_TOKEN_MS = parseDurationToMs(ACCESS_TOKEN_TTL);
const REFRESH_TOKEN_MS = parseDurationToMs(REFRESH_TOKEN_TTL);

const getAccessSecret = () => process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const getSessionExpiryDate = () => new Date(Date.now() + REFRESH_TOKEN_MS);
const hashSessionToken = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const getClientIp = (req) => (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.ip
    || req.socket?.remoteAddress
    || ''
);

const getAdminSubjectId = () => hashSessionToken(`${process.env.ADMIN_EMAIL || ''}:${process.env.ADMIN_PASSWORD || ''}`);

const assertRole = (role) => {
    if (!AUTH_ROLES.includes(role)) {
        throw new Error(`Unsupported auth role: ${role}`);
    }
};

const assertCurrentAdminFingerprint = (subjectId) => {
    if (subjectId !== getAdminSubjectId()) {
        throw new Error('Admin session is no longer valid');
    }
};

const signAccessToken = ({ subjectId, role, sessionId, tokenId }) => (
    jwt.sign(
        { sub: String(subjectId), role, sid: sessionId, type: 'access', jti: tokenId },
        getAccessSecret(),
        { expiresIn: ACCESS_TOKEN_TTL },
    )
);

const signRefreshToken = ({ subjectId, role, sessionId, tokenId }) => (
    jwt.sign(
        { sub: String(subjectId), role, sid: sessionId, type: 'refresh', jti: tokenId },
        getRefreshSecret(),
        { expiresIn: REFRESH_TOKEN_TTL },
    )
);

const buildSessionResponse = ({ accessToken, refreshToken }) => ({
    token: accessToken,
    accessToken,
    refreshToken,
    accessTokenExpiresIn: Math.floor(ACCESS_TOKEN_MS / 1000),
    refreshTokenExpiresIn: Math.floor(REFRESH_TOKEN_MS / 1000),
});

const createSignedTokenPair = ({ subjectId, role, sessionId }) => {
    const accessToken = signAccessToken({
        subjectId,
        role,
        sessionId,
        tokenId: crypto.randomBytes(12).toString('hex'),
    });
    const refreshToken = signRefreshToken({
        subjectId,
        role,
        sessionId,
        tokenId: crypto.randomBytes(12).toString('hex'),
    });

    return {
        accessToken,
        refreshToken,
        response: buildSessionResponse({ accessToken, refreshToken }),
    };
};

const issueAuthTokens = async ({ subjectId, role, req }) => {
    assertRole(role);

    if (role === 'admin') {
        assertCurrentAdminFingerprint(String(subjectId));
    }

    const sessionId = crypto.randomBytes(24).toString('hex');
    const { accessToken, refreshToken, response } = createSignedTokenPair({ subjectId, role, sessionId });

    await authSessionModel.create({
        sessionId,
        subjectId: String(subjectId),
        role,
        refreshTokenHash: hashSessionToken(refreshToken),
        expiresAt: getSessionExpiryDate(),
        lastUsedAt: new Date(),
        lastRotatedAt: new Date(),
        userAgent: req?.headers?.['user-agent'] || '',
        ipAddress: getClientIp(req),
    });

    return response;
};

const findActiveSession = async ({ sessionId, subjectId, role }) => authSessionModel.findOne({
    sessionId,
    subjectId: String(subjectId),
    role,
    revokedAt: null,
});

const verifyAccessTokenSession = async (accessToken, expectedRole) => {
    const decoded = jwt.verify(accessToken, getAccessSecret());

    if (decoded.type !== 'access') {
        throw new Error('Invalid session token');
    }

    if (expectedRole && decoded.role !== expectedRole) {
        throw new Error('Role mismatch');
    }

    if (decoded.role === 'admin') {
        assertCurrentAdminFingerprint(decoded.sub);
    }

    const session = await findActiveSession({
        sessionId: decoded.sid,
        subjectId: decoded.sub,
        role: decoded.role,
    });

    if (!session || session.expiresAt <= new Date()) {
        throw new Error('Session expired. Please login again.');
    }

    return {
        sessionId: session.sessionId,
        subjectId: session.subjectId,
        role: session.role,
    };
};

const rotateRefreshSession = async (refreshToken, expectedRole, req) => {
    const decoded = jwt.verify(refreshToken, getRefreshSecret());

    if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
    }

    if (expectedRole && decoded.role !== expectedRole) {
        throw new Error('Role mismatch');
    }

    if (decoded.role === 'admin') {
        assertCurrentAdminFingerprint(decoded.sub);
    }

    const session = await findActiveSession({
        sessionId: decoded.sid,
        subjectId: decoded.sub,
        role: decoded.role,
    });

    if (!session || session.expiresAt <= new Date()) {
        throw new Error('Refresh session expired');
    }

    if (session.refreshTokenHash !== hashSessionToken(refreshToken)) {
        await authSessionModel.updateOne(
            { _id: session._id },
            { revokedAt: new Date(), revokedReason: 'Refresh token mismatch' },
        );
        throw new Error('Refresh token has already been rotated');
    }

    const { accessToken, refreshToken: nextRefreshToken, response } = createSignedTokenPair({
        subjectId: session.subjectId,
        role: session.role,
        sessionId: session.sessionId,
    });

    session.refreshTokenHash = hashSessionToken(nextRefreshToken);
    session.expiresAt = getSessionExpiryDate();
    session.lastUsedAt = new Date();
    session.lastRotatedAt = new Date();
    session.userAgent = req?.headers?.['user-agent'] || session.userAgent;
    session.ipAddress = getClientIp(req) || session.ipAddress;
    await session.save();

    return {
        subjectId: session.subjectId,
        role: session.role,
        sessionId: session.sessionId,
        token: accessToken,
        accessToken,
        refreshToken: nextRefreshToken,
        accessTokenExpiresIn: response.accessTokenExpiresIn,
        refreshTokenExpiresIn: response.refreshTokenExpiresIn,
    };
};

const revokeSessionById = async (sessionId, reason = 'User logout') => {
    if (!sessionId) return;

    await authSessionModel.updateOne(
        { sessionId, revokedAt: null },
        { revokedAt: new Date(), revokedReason: reason },
    );
};

const revokeAllSessionsForSubject = async ({ subjectId, role, reason = 'Credential reset' }) => {
    assertRole(role);

    await authSessionModel.updateMany(
        { subjectId: String(subjectId), role, revokedAt: null },
        { revokedAt: new Date(), revokedReason: reason },
    );
};

export {
    ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL,
    buildSessionResponse,
    getAdminSubjectId,
    hashSessionToken,
    issueAuthTokens,
    parseDurationToMs,
    revokeAllSessionsForSubject,
    revokeSessionById,
    rotateRefreshSession,
    verifyAccessTokenSession,
};
