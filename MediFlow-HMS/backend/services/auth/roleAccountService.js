import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { issueAuthTokens, revokeAllSessionsForSubject, revokeSessionById, rotateRefreshSession } from '../../utils/authSessions.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../emailService.js';

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
    origin,
    repository,
    emailConfig,
    notFoundMessage,
}) => {
    const account = await repository.findByEmail(email);

    if (!account) {
        return { success: false, message: notFoundMessage };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    account.resetToken = resetToken;
    account.resetTokenExpiry = Date.now() + 3600000;
    await account.save();

    await sendPasswordResetEmail({
        email,
        origin,
        token: resetToken,
        ...emailConfig,
    });

    return {
        success: true,
        message: 'Reset link sent to your email',
    };
};

const resetRolePassword = async ({
    token,
    newPassword,
    req,
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

    const session = await issueAuthTokens({
        subjectId: account._id,
        role,
        req,
    });

    return {
        success: true,
        message: 'Password reset successfully',
        ...session,
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
    verifyRoleEmail,
};
