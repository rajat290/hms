import bcrypt from 'bcrypt';
import crypto from 'crypto';
import validator from 'validator';
import {
    createUser,
    findUserByEmail,
    findUserById,
    findUserByResetToken,
    findUserByVerificationToken,
} from '../../repositories/userAuthRepository.js';
import { sendPasswordResetEmail, sendTwoFactorCodeEmail, sendVerificationEmail } from '../emailService.js';
import { issueAuthTokens, revokeAllSessionsForSubject } from '../../utils/authSessions.js';

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const resendVerificationEmail = async ({ user, email, origin }) => {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail({
        email,
        origin,
        token: verificationToken,
        subject: 'Verify Your Email - Mediflow',
        heading: 'Email Verification Required',
        body: 'Please click the button below to verify your email address.',
    });
};

const registerUserAccount = async ({ name, email, password, origin }) => {
    if (!name || !email || !password) {
        throw new Error('Missing Details');
    }

    if (!validator.isEmail(email)) {
        throw new Error('Please enter a valid email');
    }

    if (password.length < 8) {
        throw new Error('Please enter a strong password');
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await createUser({
        name,
        email,
        password: hashedPassword,
        verificationToken,
    });

    await sendVerificationEmail({
        email,
        origin,
        token: verificationToken,
        subject: 'Email Verification - Mediflow',
        heading: 'Welcome to Mediflow!',
        body: 'Please click the button below to verify your email address and activate your account:',
    });

    return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
    };
};

const loginUserAccount = async ({ email, password, origin, req }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return { success: false, message: 'User does not exist' };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isVerified) {
        await resendVerificationEmail({ user, email, origin });
        return {
            success: false,
            message: 'Email not verified. A new verification link has been sent to your email.',
        };
    }

    if (user.twoFactorEnabled) {
        const code = crypto.randomInt(100000, 999999).toString();
        user.twoFactorCode = code;
        user.twoFactorCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendTwoFactorCodeEmail({ email, code });

        return {
            success: true,
            twoFactorRequired: true,
            userId: user._id,
            message: '2FA code sent to your email.',
        };
    }

    const session = await issueAuthTokens({
        subjectId: user._id,
        role: 'user',
        req,
    });

    return {
        success: true,
        ...session,
    };
};

const verifyUserEmail = async ({ token }) => {
    const user = await findUserByVerificationToken(token);
    if (!user) {
        return { success: false, message: 'Invalid token' };
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return { success: true, message: 'Email verified successfully' };
};

const requestUserPasswordReset = async ({ email, origin }) => {
    const user = await findUserByEmail(email);
    if (!user) {
        return { success: false, message: 'User not found' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    await sendPasswordResetEmail({
        email,
        origin,
        token: resetToken,
        subject: 'Password Reset - Mediflow',
        accountLabel: '',
    });

    return { success: true, message: 'Reset token sent to email' };
};

const resetUserPassword = async ({ token, newPassword, req }) => {
    const user = await findUserByResetToken(token);
    if (!user) {
        return { success: false, message: 'Invalid or expired token' };
    }

    user.password = await hashPassword(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.isVerified = true;
    user.verificationToken = undefined;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    await revokeAllSessionsForSubject({
        subjectId: user._id,
        role: 'user',
        reason: 'Password reset',
    });

    const session = await issueAuthTokens({
        subjectId: user._id,
        role: 'user',
        req,
    });

    return {
        success: true,
        message: 'Password reset successfully',
        ...session,
    };
};

const enableUserTwoFactor = async ({ userId }) => {
    const user = await findUserById(userId);
    if (!user) {
        return { success: false, message: 'User not found' };
    }

    user.twoFactorEnabled = true;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    return {
        success: true,
        message: '2FA enabled. Future logins will require an email verification code.',
    };
};

const verifyUserTwoFactor = async ({ userId, code, req }) => {
    const user = await findUserById(userId);
    if (!user || !user.twoFactorEnabled) {
        return { success: false, message: '2FA not enabled' };
    }

    if (!user.twoFactorCode || user.twoFactorCodeExpiry <= new Date()) {
        user.twoFactorCode = undefined;
        user.twoFactorCodeExpiry = undefined;
        await user.save();
        return { success: false, message: '2FA code expired. Please login again.' };
    }

    if (user.twoFactorCode !== code) {
        return { success: false, message: 'Invalid code' };
    }

    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    await user.save();

    const session = await issueAuthTokens({
        subjectId: user._id,
        role: 'user',
        req,
    });

    return {
        success: true,
        message: '2FA verified',
        ...session,
    };
};

export {
    enableUserTwoFactor,
    loginUserAccount,
    registerUserAccount,
    requestUserPasswordReset,
    resetUserPassword,
    verifyUserEmail,
    verifyUserTwoFactor,
};
