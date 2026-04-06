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
  loginUserAccount,
  registerUserAccount,
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
