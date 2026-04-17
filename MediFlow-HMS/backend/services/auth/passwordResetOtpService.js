import crypto from 'crypto';

const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_SESSION_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_OTP_MAX_ATTEMPTS = 5;

const hashResetOtp = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const createResetOtpCode = () => crypto.randomInt(100000, 1000000).toString();
const createResetSessionToken = () => crypto.randomBytes(32).toString('hex');

const clearResetOtpState = (account) => {
    account.resetOtpCodeHash = undefined;
    account.resetOtpExpiry = undefined;
    account.resetOtpAttempts = 0;
};

const clearResetSessionState = (account) => {
    account.resetToken = undefined;
    account.resetTokenExpiry = undefined;
};

const issuePasswordResetOtp = (account) => {
    const code = createResetOtpCode();

    account.resetOtpCodeHash = hashResetOtp(code);
    account.resetOtpExpiry = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);
    account.resetOtpAttempts = 0;
    clearResetSessionState(account);

    return code;
};

const verifyPasswordResetOtp = ({ account, code }) => {
    if (!account.resetOtpCodeHash || !account.resetOtpExpiry || account.resetOtpExpiry <= new Date()) {
        clearResetOtpState(account);
        clearResetSessionState(account);
        return {
            success: false,
            message: 'The reset code has expired. Please request a new one.',
        };
    }

    if (account.resetOtpCodeHash !== hashResetOtp(code)) {
        const nextAttempts = (account.resetOtpAttempts || 0) + 1;
        account.resetOtpAttempts = nextAttempts;

        if (nextAttempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
            clearResetOtpState(account);
            clearResetSessionState(account);
            return {
                success: false,
                message: 'Too many invalid attempts. Please request a new code.',
            };
        }

        return {
            success: false,
            message: 'The reset code is invalid.',
        };
    }

    clearResetOtpState(account);
    account.resetToken = createResetSessionToken();
    account.resetTokenExpiry = new Date(Date.now() + PASSWORD_RESET_SESSION_TTL_MS);

    return {
        success: true,
        message: 'Code verified. You can now set a new password.',
        resetToken: account.resetToken,
    };
};

export {
    clearResetOtpState,
    clearResetSessionState,
    createResetOtpCode,
    hashResetOtp,
    issuePasswordResetOtp,
    verifyPasswordResetOtp,
};
