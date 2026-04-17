import { getAppConfig } from '../config/appConfig.js';

const SESSION_COOKIE_NAMES = {
    user: {
        access: 'mediflow_user_access',
        refresh: 'mediflow_user_refresh',
    },
    admin: {
        access: 'mediflow_admin_access',
        refresh: 'mediflow_admin_refresh',
    },
    doctor: {
        access: 'mediflow_doctor_access',
        refresh: 'mediflow_doctor_refresh',
    },
    staff: {
        access: 'mediflow_staff_access',
        refresh: 'mediflow_staff_refresh',
    },
};

const BACKOFFICE_ROLES = ['admin', 'doctor', 'staff'];

const normalizeSameSite = (value) => {
    const normalizedValue = String(value || '').trim().toLowerCase();
    if (['lax', 'strict', 'none'].includes(normalizedValue)) {
        return normalizedValue;
    }

    return 'lax';
};

const parseCookieHeader = (cookieHeader = '') => (
    String(cookieHeader || '')
        .split(';')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .reduce((cookies, chunk) => {
            const separatorIndex = chunk.indexOf('=');

            if (separatorIndex === -1) {
                return cookies;
            }

            const key = chunk.slice(0, separatorIndex).trim();
            const value = chunk.slice(separatorIndex + 1).trim();

            if (!key) {
                return cookies;
            }

            cookies[key] = decodeURIComponent(value);
            return cookies;
        }, {})
);

const getCookieNamesForRole = (role) => SESSION_COOKIE_NAMES[role];

const buildCookieOptions = ({ maxAge } = {}) => {
    const { security, server } = getAppConfig();
    const sameSite = normalizeSameSite(
        security.cookieSameSite || (server.env === 'production' ? 'none' : 'lax'),
    );
    const secure = Boolean(security.cookieSecure) || sameSite === 'none';

    return {
        httpOnly: true,
        sameSite,
        secure,
        path: '/',
        ...(security.cookieDomain ? { domain: security.cookieDomain } : {}),
        ...(typeof maxAge === 'number' ? { maxAge } : {}),
    };
};

const buildExpiredCookieOptions = () => ({
    ...buildCookieOptions({ maxAge: 0 }),
    expires: new Date(0),
});

const getRequestCookies = (req) => parseCookieHeader(req?.headers?.cookie);

const extractBearerToken = (authorizationHeader = '') => {
    const match = String(authorizationHeader || '').match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : '';
};

const getAccessTokenFromRequest = (req, role, headerName) => {
    const cookieNames = getCookieNamesForRole(role);
    const cookies = getRequestCookies(req);
    const headerToken = req?.headers?.[String(headerName || '').toLowerCase()] || '';
    const authorizationToken = extractBearerToken(req?.headers?.authorization);

    return cookies[cookieNames?.access] || headerToken || authorizationToken || '';
};

const getRefreshTokenFromRequest = (req, role) => {
    const cookieNames = getCookieNamesForRole(role);
    const cookies = getRequestCookies(req);

    return cookies[cookieNames?.refresh] || req?.body?.refreshToken || '';
};

const requestHasRefreshToken = (req) => {
    if (req?.body?.refreshToken) {
        return true;
    }

    const cookies = getRequestCookies(req);
    return Object.values(SESSION_COOKIE_NAMES).some(({ refresh }) => Boolean(cookies[refresh]));
};

const setSessionCookies = (res, role, session) => {
    const cookieNames = getCookieNamesForRole(role);

    if (!cookieNames || !session?.refreshToken) {
        return;
    }

    const accessToken = session.accessToken || session.token || '';
    const accessMaxAge = Number(session.accessTokenExpiresIn || 0) * 1000;
    const refreshMaxAge = Number(session.refreshTokenExpiresIn || 0) * 1000;

    res.cookie(cookieNames.access, accessToken, buildCookieOptions({ maxAge: accessMaxAge }));
    res.cookie(cookieNames.refresh, session.refreshToken, buildCookieOptions({ maxAge: refreshMaxAge }));
};

const clearSessionCookies = (res, role) => {
    const cookieNames = getCookieNamesForRole(role);

    if (!cookieNames) {
        return;
    }

    const expiredOptions = buildExpiredCookieOptions();
    res.cookie(cookieNames.access, '', expiredOptions);
    res.cookie(cookieNames.refresh, '', expiredOptions);
};

const clearBackofficeSessionCookies = (res) => {
    BACKOFFICE_ROLES.forEach((role) => clearSessionCookies(res, role));
};

export {
    BACKOFFICE_ROLES,
    clearBackofficeSessionCookies,
    clearSessionCookies,
    getAccessTokenFromRequest,
    getRefreshTokenFromRequest,
    requestHasRefreshToken,
    setSessionCookies,
};
