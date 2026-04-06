import { jest } from '@jest/globals';
import authSessionModel from '../models/authSessionModel.js';
import {
  getAdminSubjectId,
  hashSessionToken,
  issueAuthTokens,
  parseDurationToMs,
  revokeAllSessionsForSubject,
  rotateRefreshSession,
  verifyAccessTokenSession,
} from '../utils/authSessions.js';

process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ADMIN_EMAIL = 'admin@mediflow.test';
process.env.ADMIN_PASSWORD = 'super-secret-password';

describe('authSessions utilities', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('parses supported token durations into milliseconds', () => {
    expect(parseDurationToMs('15m')).toBe(15 * 60 * 1000);
    expect(parseDurationToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('issues access and refresh tokens while storing a hashed refresh token', async () => {
    const createSpy = jest.spyOn(authSessionModel, 'create').mockResolvedValue({});

    const session = await issueAuthTokens({
      subjectId: '507f1f77bcf86cd799439011',
      role: 'user',
      req: {
        headers: { 'user-agent': 'Jest' },
        ip: '127.0.0.1',
      },
    });

    expect(session.token).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectId: '507f1f77bcf86cd799439011',
        role: 'user',
        refreshTokenHash: hashSessionToken(session.refreshToken),
      })
    );
  });

  it('rotates refresh tokens for an active session', async () => {
    const createSpy = jest.spyOn(authSessionModel, 'create').mockResolvedValue({});

    const issuedSession = await issueAuthTokens({
      subjectId: '507f1f77bcf86cd799439011',
      role: 'user',
      req: { headers: {} },
    });

    const createdRecord = createSpy.mock.calls[0][0];
    const activeSession = {
      _id: 'session-db-id',
      sessionId: createdRecord.sessionId,
      subjectId: createdRecord.subjectId,
      role: createdRecord.role,
      refreshTokenHash: createdRecord.refreshTokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      userAgent: '',
      ipAddress: '',
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(authSessionModel, 'findOne').mockResolvedValue(activeSession);

    const rotatedSession = await rotateRefreshSession(issuedSession.refreshToken, 'user', {
      headers: { 'user-agent': 'Rotated Agent' },
      ip: '127.0.0.2',
    });

    expect(rotatedSession.token).toBeTruthy();
    expect(rotatedSession.refreshToken).toBeTruthy();
    expect(rotatedSession.refreshToken).not.toBe(issuedSession.refreshToken);
    expect(activeSession.refreshTokenHash).toBe(hashSessionToken(rotatedSession.refreshToken));
    expect(activeSession.save).toHaveBeenCalled();
  });

  it('validates access tokens against the active session store', async () => {
    const createSpy = jest.spyOn(authSessionModel, 'create').mockResolvedValue({});

    const issuedSession = await issueAuthTokens({
      subjectId: '507f1f77bcf86cd799439011',
      role: 'doctor',
      req: { headers: {} },
    });

    const createdRecord = createSpy.mock.calls[0][0];
    jest.spyOn(authSessionModel, 'findOne').mockResolvedValue({
      sessionId: createdRecord.sessionId,
      subjectId: createdRecord.subjectId,
      role: createdRecord.role,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await expect(verifyAccessTokenSession(issuedSession.token, 'doctor')).resolves.toEqual({
      sessionId: createdRecord.sessionId,
      subjectId: createdRecord.subjectId,
      role: 'doctor',
    });
  });

  it('revokes all sessions for a subject when credentials are reset', async () => {
    const updateManySpy = jest.spyOn(authSessionModel, 'updateMany').mockResolvedValue({ modifiedCount: 2 });

    await revokeAllSessionsForSubject({
      subjectId: '507f1f77bcf86cd799439011',
      role: 'staff',
      reason: 'Password reset',
    });

    expect(updateManySpy).toHaveBeenCalledWith(
      {
        subjectId: '507f1f77bcf86cd799439011',
        role: 'staff',
        revokedAt: null,
      },
      expect.objectContaining({
        revokedReason: 'Password reset',
      })
    );
  });

  it('invalidates admin sessions when the credential fingerprint changes', async () => {
    const createSpy = jest.spyOn(authSessionModel, 'create').mockResolvedValue({});
    const adminSubjectId = getAdminSubjectId();

    const issuedSession = await issueAuthTokens({
      subjectId: adminSubjectId,
      role: 'admin',
      req: { headers: {} },
    });

    const createdRecord = createSpy.mock.calls[0][0];
    jest.spyOn(authSessionModel, 'findOne').mockResolvedValue({
      sessionId: createdRecord.sessionId,
      subjectId: createdRecord.subjectId,
      role: createdRecord.role,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    process.env.ADMIN_PASSWORD = 'rotated-password';

    await expect(verifyAccessTokenSession(issuedSession.token, 'admin')).rejects.toThrow('Admin session is no longer valid');

    process.env.ADMIN_PASSWORD = 'super-secret-password';
  });
});
