import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { issueAuthTokens, revokeAllSessionsForSubject, revokeSessionById, rotateRefreshSession } from '../../utils/authSessions.js';
import { sendPasswordResetOtpEmail, sendVerificationEmail } from '../emailService.js';
import { issuePasswordResetOtp, verifyPasswordResetOtp } from './passwordResetOtpService.js';

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const resendVerificationEmail = async ({
    account,
    email,
    origin,
    verificationEmail,
}) => {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    account.verificationToken = verificationToken;
    await account.save();

    await sendVerificationEmail({
        email,
        origin,
        token: verificationToken,
        ...verificationEmail,
    });
};

const loginRoleAccount = async ({
    email,
    password,
    origin,
    req,
    role,
    repository,
    verificationEmail,
    invalidCredentialsMessage = 'Invalid credentials',
}) => {
    const account = await repository.findByEmail(email);

    if (!account) {
        return { success: false, message: invalidCredentialsMessage };
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
        return { success: false, message: invalidCredentialsMessage };
    }

    if (!account.isVerified) {
        await resendVerificationEmail({
            account,
            email,
            origin,
            verificationEmail,
        });

        return {
            success: false,
            message: 'Email not verified. A new verification link has been sent.',
        };
    }

    const session = await issueAuthTokens({
        subjectId: account._id,
        role,
        req,
    });

    return {
        success: true,
        ...session,
    };
};

const verifyRoleEmail = async ({
    token,
    repository,
    successMessage,
}) => {
    const account = await repository.findByVerificationToken(token);

    if (!account) {
        return { success: false, message: 'Invalid token' };
    }

    account.isVerified = true;
    account.verificationToken = undefined;
    await account.save();

    return { success: true, message: successMessage };
};

const requestRolePasswordReset = async ({
    email,
    repository,
    emailConfig,
}) => {
    const account = await repository.findByEmail(email);

    if (account) {
        const code = issuePasswordResetOtp(account);
        await account.save();

        await sendPasswordResetOtpEmail({
            email,
            code,
            ...emailConfig,
        });
    }

    return {
        success: true,
        message: 'If an account exists for this email, a 6-digit reset code has been sent.',
    };
};

const verifyRolePasswordResetOtp = async ({
    email,
    code,
    repository,
}) => {
    const account = await repository.findByResetOtpEmail(email);

    if (!account) {
        return { success: false, message: 'Invalid email or reset code.' };
    }

    const verification = verifyPasswordResetOtp({ account, code });
    await account.save();

    return verification;
};

const resetRolePassword = async ({
    token,
    newPassword,
    role,
    repository,
    minPasswordLength = 8,
}) => {
    const account = await repository.findByResetToken(token);

    if (!account) {
        return { success: false, message: 'Invalid or expired token' };
    }

    if (newPassword.length < minPasswordLength) {
        return {
            success: false,
            message: `Please enter a strong password (min ${minPasswordLength} chars)`,
        };
    }

    account.password = await hashPassword(newPassword);
    account.resetToken = undefined;
    account.resetTokenExpiry = undefined;
    account.isVerified = true;
    account.verificationToken = undefined;
    await account.save();

    await revokeAllSessionsForSubject({
        subjectId: account._id,
        role,
        reason: 'Password reset',
    });

    return {
        success: true,
        message: 'Password reset successfully. Please sign in with your new password.',
    };
};

const refreshRoleSession = async ({ refreshToken, role, req }) => {
    const session = await rotateRefreshSession(refreshToken, role, req);
    return {
        success: true,
        ...session,
    };
};

const logoutRoleSession = async ({ sessionId, reason }) => {
    await revokeSessionById(sessionId, reason);
    return {
        success: true,
        message: 'Logged out successfully',
    };
};

export {
    loginRoleAccount,
    logoutRoleSession,
    refreshRoleSession,
    requestRolePasswordReset,
    resetRolePassword,
    verifyRolePasswordResetOtp,
    verifyRoleEmail,
};
