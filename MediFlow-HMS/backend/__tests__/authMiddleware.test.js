import { jest } from '@jest/globals';

const verifyAccessTokenSessionMock = jest.fn();

jest.unstable_mockModule('../utils/authSessions.js', () => ({
  verifyAccessTokenSession: verifyAccessTokenSessionMock,
}));

const { default: authUser } = await import('../middleware/authUser.js');
const { default: authAdmin } = await import('../middleware/authAdmin.js');

const runMiddleware = async (middleware, reqOverrides = {}) => {
  const req = {
    headers: {},
    body: {},
    ...reqOverrides,
  };

  let statusCode = 200;
  let payload;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return data;
    },
  };

  await middleware(req, res, () => {
    nextCalled = true;
  });

  return { req, statusCode, payload, nextCalled };
};

describe('role auth middleware', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('rejects requests with no user token header', async () => {
    const result = await runMiddleware(authUser);

    expect(result.nextCalled).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.payload).toEqual({
      success: false,
      message: 'Not Authorized Login Again',
    });
  });

  it('injects the authenticated user id into the request body for user routes', async () => {
    verifyAccessTokenSessionMock.mockResolvedValue({
      sessionId: 'session-1',
      subjectId: 'user-1',
      role: 'user',
    });

    const result = await runMiddleware(authUser, {
      headers: { token: 'access-token' },
      body: { existing: true },
    });

    expect(verifyAccessTokenSessionMock).toHaveBeenCalledWith('access-token', 'user');
    expect(result.nextCalled).toBe(true);
    expect(result.req.body.userId).toBe('user-1');
    expect(result.req.auth).toEqual({
      sessionId: 'session-1',
      subjectId: 'user-1',
      role: 'user',
    });
  });

  it('accepts httpOnly-style cookie tokens before falling back to headers', async () => {
    verifyAccessTokenSessionMock.mockResolvedValue({
      sessionId: 'session-cookie-1',
      subjectId: 'user-cookie-1',
      role: 'user',
    });

    const result = await runMiddleware(authUser, {
      headers: {
        cookie: 'mediflow_user_access=cookie-access-token',
      },
    });

    expect(verifyAccessTokenSessionMock).toHaveBeenCalledWith('cookie-access-token', 'user');
    expect(result.nextCalled).toBe(true);
    expect(result.req.body.userId).toBe('user-cookie-1');
  });

  it('maps token-expiry errors to the session-expired message', async () => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    verifyAccessTokenSessionMock.mockRejectedValue(expiredError);

    const result = await runMiddleware(authUser, {
      headers: { token: 'expired-token' },
    });

    expect(result.nextCalled).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.payload).toEqual({
      success: false,
      message: 'Session expired. Please login again.',
    });
  });

  it('uses the admin header and injects adminId for admin routes', async () => {
    verifyAccessTokenSessionMock.mockResolvedValue({
      sessionId: 'admin-session-1',
      subjectId: 'admin-subject',
      role: 'admin',
    });

    const result = await runMiddleware(authAdmin, {
      headers: { atoken: 'admin-token' },
    });

    expect(verifyAccessTokenSessionMock).toHaveBeenCalledWith('admin-token', 'admin');
    expect(result.nextCalled).toBe(true);
    expect(result.req.body.adminId).toBe('admin-subject');
  });
});
