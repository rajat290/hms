import bcrypt from 'bcrypt';
import { jest } from '@jest/globals';

const createUserMock = jest.fn();
const findUserByEmailMock = jest.fn();
const findUserByIdMock = jest.fn();
const findUserByResetTokenMock = jest.fn();
const findUserByVerificationTokenMock = jest.fn();
const sendPasswordResetEmailMock = jest.fn();
const sendTwoFactorCodeEmailMock = jest.fn();
const sendVerificationEmailMock = jest.fn();
const issueAuthTokensMock = jest.fn();
const revokeAllSessionsForSubjectMock = jest.fn();

jest.unstable_mockModule('../repositories/userAuthRepository.js', () => ({
  createUser: createUserMock,
  findUserByEmail: findUserByEmailMock,
  findUserById: findUserByIdMock,
  findUserByResetToken: findUserByResetTokenMock,
  findUserByVerificationToken: findUserByVerificationTokenMock,
}));

jest.unstable_mockModule('../services/emailService.js', () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock,
  sendTwoFactorCodeEmail: sendTwoFactorCodeEmailMock,
  sendVerificationEmail: sendVerificationEmailMock,
}));

jest.unstable_mockModule('../utils/authSessions.js', () => ({
  issueAuthTokens: issueAuthTokensMock,
  revokeAllSessionsForSubject: revokeAllSessionsForSubjectMock,
}));

const {
  enableUserTwoFactor,
  loginUserAccount,
  registerUserAccount,
  requestUserPasswordReset,
  resetUserPassword,
  verifyUserEmail,
  verifyUserTwoFactor,
} = await import('../services/auth/userAuthService.js');

describe('userAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user through the repository and sends a verification email', async () => {
    createUserMock.mockResolvedValue({ _id: 'user-1' });

    const response = await registerUserAccount({
      name: 'Alice',
      email: 'alice@mediflow.test',
      password: 'secret123',
      origin: 'http://localhost:5173',
    });

    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alice',
        email: 'alice@mediflow.test',
        password: expect.any(String),
        verificationToken: expect.any(String),
      })
    );
    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@mediflow.test',
        origin: 'http://localhost:5173',
      })
    );
    expect(response).toEqual({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });
  });

  it('logs in verified users through the auth-session utility', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    findUserByEmailMock.mockResolvedValue({
      _id: 'user-1',
      email: 'alice@mediflow.test',
      password: passwordHash,
      isVerified: true,
      twoFactorEnabled: false,
    });
    issueAuthTokensMock.mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = await loginUserAccount({
      email: 'alice@mediflow.test',
      password: 'secret123',
      origin: 'http://localhost:5173',
      req: { headers: {} },
    });

    expect(issueAuthTokensMock).toHaveBeenCalledWith({
      subjectId: 'user-1',
      role: 'user',
      req: { headers: {} },
    });
    expect(response).toEqual({
      success: true,
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('resends verification when an unverified user logs in', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const saveMock = jest.fn().mockResolvedValue(undefined);

    findUserByEmailMock.mockResolvedValue({
      _id: 'user-1',
      email: 'alice@mediflow.test',
      password: passwordHash,
      isVerified: false,
      save: saveMock,
    });

    const response = await loginUserAccount({
      email: 'alice@mediflow.test',
      password: 'secret123',
      origin: 'http://localhost:5173',
      req: { headers: {} },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@mediflow.test',
        origin: 'http://localhost:5173',
        subject: 'Verify Your Email - Mediflow',
      })
    );
    expect(response).toEqual({
      success: false,
      message: 'Email not verified. A new verification link has been sent to your email.',
    });
  });

  it('sends a 2FA code instead of issuing tokens when 2FA is enabled', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const saveMock = jest.fn().mockResolvedValue(undefined);

    findUserByEmailMock.mockResolvedValue({
      _id: 'user-2',
      email: 'alice@mediflow.test',
      password: passwordHash,
      isVerified: true,
      twoFactorEnabled: true,
      save: saveMock,
    });

    const response = await loginUserAccount({
      email: 'alice@mediflow.test',
      password: 'secret123',
      origin: 'http://localhost:5173',
      req: { headers: {} },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(sendTwoFactorCodeEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@mediflow.test',
        code: expect.any(String),
      })
    );
    expect(issueAuthTokensMock).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      success: true,
      twoFactorRequired: true,
      userId: 'user-2',
      message: '2FA code sent to your email.',
    });
  });

  it('verifies email tokens when a matching user exists', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    findUserByVerificationTokenMock.mockResolvedValue({
      isVerified: false,
      verificationToken: 'token-123',
      save: saveMock,
    });

    const response = await verifyUserEmail({ token: 'token-123' });

    expect(saveMock).toHaveBeenCalled();
    expect(response).toEqual({
      success: true,
      message: 'Email verified successfully',
    });
  });

  it('starts password reset flows and emails the reset token', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    findUserByEmailMock.mockResolvedValue({
      _id: 'user-1',
      email: 'alice@mediflow.test',
      save: saveMock,
    });

    const response = await requestUserPasswordReset({
      email: 'alice@mediflow.test',
      origin: 'http://localhost:5173',
    });

    expect(saveMock).toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@mediflow.test',
        origin: 'http://localhost:5173',
        token: expect.any(String),
      })
    );
    expect(response).toEqual({
      success: true,
      message: 'Reset token sent to email',
    });
  });

  it('resets passwords, revokes old sessions, and returns a fresh session', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    findUserByResetTokenMock.mockResolvedValue({
      _id: 'user-3',
      save: saveMock,
    });
    issueAuthTokensMock.mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = await resetUserPassword({
      token: 'reset-token',
      newPassword: 'new-secret123',
      req: { headers: { 'user-agent': 'jest' } },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(revokeAllSessionsForSubjectMock).toHaveBeenCalledWith({
      subjectId: 'user-3',
      role: 'user',
      reason: 'Password reset',
    });
    expect(issueAuthTokensMock).toHaveBeenCalledWith({
      subjectId: 'user-3',
      role: 'user',
      req: { headers: { 'user-agent': 'jest' } },
    });
    expect(response).toEqual({
      success: true,
      message: 'Password reset successfully',
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('enables 2FA for existing users and handles missing users safely', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    findUserByIdMock.mockResolvedValueOnce({
      _id: 'user-4',
      save: saveMock,
    });

    await expect(enableUserTwoFactor({ userId: 'user-4' })).resolves.toEqual({
      success: true,
      message: '2FA enabled. Future logins will require an email verification code.',
    });
    expect(saveMock).toHaveBeenCalled();

    findUserByIdMock.mockResolvedValueOnce(null);
    await expect(enableUserTwoFactor({ userId: 'missing-user' })).resolves.toEqual({
      success: false,
      message: 'User not found',
    });
  });

  it('rejects expired 2FA codes and clears the stale code fields', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    findUserByIdMock.mockResolvedValue({
      _id: 'user-5',
      twoFactorEnabled: true,
      twoFactorCode: '654321',
      twoFactorCodeExpiry: new Date(Date.now() - 1000),
      save: saveMock,
    });

    const response = await verifyUserTwoFactor({
      userId: 'user-5',
      code: '654321',
      req: { headers: {} },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(issueAuthTokensMock).not.toHaveBeenCalled();
    expect(response).toEqual({
      success: false,
      message: '2FA code expired. Please login again.',
    });
  });

  it('verifies 2FA codes and clears the one-time code fields before issuing a session', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    findUserByIdMock.mockResolvedValue({
      _id: 'user-2',
      twoFactorEnabled: true,
      twoFactorCode: '654321',
      twoFactorCodeExpiry: new Date(Date.now() + 60 * 1000),
      save: saveMock,
    });
    issueAuthTokensMock.mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = await verifyUserTwoFactor({
      userId: 'user-2',
      code: '654321',
      req: { headers: {} },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(issueAuthTokensMock).toHaveBeenCalledWith({
      subjectId: 'user-2',
      role: 'user',
      req: { headers: {} },
    });
    expect(response).toEqual({
      success: true,
      message: '2FA verified',
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
