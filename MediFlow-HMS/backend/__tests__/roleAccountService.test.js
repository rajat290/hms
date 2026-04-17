import bcrypt from 'bcrypt';
import { jest } from '@jest/globals';
import crypto from 'crypto';

const sendPasswordResetOtpEmailMock = jest.fn();
const sendVerificationEmailMock = jest.fn();
const issueAuthTokensMock = jest.fn();
const revokeAllSessionsForSubjectMock = jest.fn();
const revokeSessionByIdMock = jest.fn();
const rotateRefreshSessionMock = jest.fn();

jest.unstable_mockModule('../services/emailService.js', () => ({
  sendPasswordResetOtpEmail: sendPasswordResetOtpEmailMock,
  sendVerificationEmail: sendVerificationEmailMock,
}));

jest.unstable_mockModule('../utils/authSessions.js', () => ({
  issueAuthTokens: issueAuthTokensMock,
  revokeAllSessionsForSubject: revokeAllSessionsForSubjectMock,
  revokeSessionById: revokeSessionByIdMock,
  rotateRefreshSession: rotateRefreshSessionMock,
}));

const {
  loginRoleAccount,
  logoutRoleSession,
  refreshRoleSession,
  requestRolePasswordReset,
  resetRolePassword,
  verifyRolePasswordResetOtp,
  verifyRoleEmail,
} = await import('../services/auth/roleAccountService.js');

describe('roleAccountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in a verified role account through the shared auth-session utility', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    issueAuthTokensMock.mockResolvedValue({
      token: 'doctor-access',
      refreshToken: 'doctor-refresh',
    });

    const response = await loginRoleAccount({
      email: 'doctor@mediflow.test',
      password: 'secret123',
      origin: 'http://localhost:5174',
      req: { headers: {} },
      role: 'doctor',
      repository: {
        findByEmail: jest.fn().mockResolvedValue({
          _id: 'doctor-1',
          email: 'doctor@mediflow.test',
          password: passwordHash,
          isVerified: true,
        }),
      },
      verificationEmail: {
        role: 'doctor',
        subject: 'Verify doctor',
        heading: 'Verify',
        body: 'Please verify.',
      },
    });

    expect(issueAuthTokensMock).toHaveBeenCalledWith({
      subjectId: 'doctor-1',
      role: 'doctor',
      req: { headers: {} },
    });
    expect(response).toEqual({
      success: true,
      token: 'doctor-access',
      refreshToken: 'doctor-refresh',
    });
  });

  it('resends verification when an unverified role account signs in', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const saveMock = jest.fn().mockResolvedValue(undefined);

    const response = await loginRoleAccount({
      email: 'staff@mediflow.test',
      password: 'secret123',
      origin: 'http://localhost:5174',
      req: { headers: {} },
      role: 'staff',
      repository: {
        findByEmail: jest.fn().mockResolvedValue({
          _id: 'staff-1',
          email: 'staff@mediflow.test',
          password: passwordHash,
          isVerified: false,
          save: saveMock,
        }),
      },
      verificationEmail: {
        role: 'staff',
        subject: 'Verify staff',
        heading: 'Verification',
        body: 'Please verify staff access.',
      },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'staff@mediflow.test',
        origin: 'http://localhost:5174',
        role: 'staff',
      }),
    );
    expect(response).toEqual({
      success: false,
      message: 'Email not verified. A new verification link has been sent.',
    });
  });

  it('verifies role email tokens through the shared repository interface', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);

    const response = await verifyRoleEmail({
      token: 'verification-token',
      repository: {
        findByVerificationToken: jest.fn().mockResolvedValue({
          isVerified: false,
          verificationToken: 'verification-token',
          save: saveMock,
        }),
      },
      successMessage: 'Doctor email verified successfully',
    });

    expect(saveMock).toHaveBeenCalled();
    expect(response).toEqual({
      success: true,
      message: 'Doctor email verified successfully',
    });
  });

  it('emails a 6-digit reset code for role accounts without exposing whether the account exists', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);

    const response = await requestRolePasswordReset({
      email: 'staff@mediflow.test',
      repository: {
        findByEmail: jest.fn().mockResolvedValue({
          _id: 'staff-1',
          email: 'staff@mediflow.test',
          resetOtpAttempts: 0,
          save: saveMock,
        }),
      },
      emailConfig: {
        subject: 'Password Reset Code - Mediflow Staff Panel',
        accountLabel: 'staff account',
      },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(sendPasswordResetOtpEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'staff@mediflow.test',
        code: expect.any(String),
      }),
    );
    expect(response).toEqual({
      success: true,
      message: 'If an account exists for this email, a 6-digit reset code has been sent.',
    });
  });

  it('verifies a role reset code and returns a reset token', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);

    const response = await verifyRolePasswordResetOtp({
      email: 'staff@mediflow.test',
      code: '123456',
      repository: {
        findByResetOtpEmail: jest.fn().mockResolvedValue({
          _id: 'staff-1',
          resetOtpCodeHash: crypto.createHash('sha256').update('123456').digest('hex'),
          resetOtpExpiry: new Date(Date.now() + 5 * 60 * 1000),
          resetOtpAttempts: 0,
          save: saveMock,
        }),
      },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(response).toEqual({
      success: true,
      message: 'Code verified. You can now set a new password.',
      resetToken: expect.any(String),
    });
  });

  it('resets role passwords, revokes prior sessions, and requires a fresh login', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);

    const account = {
      _id: 'staff-1',
      password: 'old-hash',
      resetToken: 'reset-token',
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      isVerified: false,
      verificationToken: 'verify-token',
      save: saveMock,
    };

    const response = await resetRolePassword({
      token: 'reset-token',
      newPassword: 'newStrongPass1',
      role: 'staff',
      repository: {
        findByResetToken: jest.fn().mockResolvedValue(account),
      },
    });

    expect(account.password).not.toBe('old-hash');
    expect(saveMock).toHaveBeenCalled();
    expect(revokeAllSessionsForSubjectMock).toHaveBeenCalledWith({
      subjectId: 'staff-1',
      role: 'staff',
      reason: 'Password reset',
    });
    expect(issueAuthTokensMock).not.toHaveBeenCalled();
    expect(response).toEqual({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  });

  it('refreshes and logs out role sessions through the shared auth-session utility', async () => {
    rotateRefreshSessionMock.mockResolvedValue({
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const refreshResponse = await refreshRoleSession({
      refreshToken: 'refresh-token',
      role: 'doctor',
      req: { headers: {} },
    });

    expect(refreshResponse).toEqual({
      success: true,
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const logoutResponse = await logoutRoleSession({
      sessionId: 'session-1',
      reason: 'Doctor logout',
    });

    expect(revokeSessionByIdMock).toHaveBeenCalledWith('session-1', 'Doctor logout');
    expect(logoutResponse).toEqual({
      success: true,
      message: 'Logged out successfully',
    });
  });
});
