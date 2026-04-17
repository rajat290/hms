import nodemailer from 'nodemailer';
import { getAppConfig } from '../config/appConfig.js';
import { logger } from '../config/logger.js';

const createEmailTransporter = () => {
    const { email } = getAppConfig();

    if (!email.isConfigured) {
        throw new Error('Email service is not configured');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email.user,
            pass: email.pass,
        },
    });
};

const sendEmail = async ({ to, subject, html }) => {
    const { email } = getAppConfig();
    const transporter = createEmailTransporter();

    return transporter.sendMail({
        from: email.user,
        to,
        subject,
        html,
    });
};

const buildVerificationUrl = ({ origin, token, role }) => {
    const roleQuery = role ? `&role=${role}` : '';
    return `${origin}/verify-email?token=${token}${roleQuery}`;
};

const buildResetUrl = ({ origin, token, role }) => {
    const roleQuery = role ? `&role=${role}` : '';
    return `${origin}/reset-password?token=${token}${roleQuery}`;
};

const sendVerificationEmail = async ({ email, origin, token, role, subject, heading, body }) => {
    const verificationUrl = buildVerificationUrl({ origin, token, role });

    return sendEmail({
        to: email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>${heading}</h2>
                <p>${body}</p>
                <a href="${verificationUrl}" style="background-color: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
                <p>If the button does not work, copy and paste this link into your browser:</p>
                <p>${verificationUrl}</p>
                <p>Thank you,<br>The Mediflow Team</p>
            </div>
        `,
    });
};

const sendPasswordResetEmail = async ({ email, origin, token, role, subject, accountLabel }) => {
    const resetUrl = buildResetUrl({ origin, token, role });
    const accountCopy = accountLabel ? ` for your ${accountLabel}` : '';

    return sendEmail({
        to: email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>You requested a password reset${accountCopy}. Please click the button below to set a new password:</p>
                <a href="${resetUrl}" style="background-color: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Thank you,<br>The Mediflow Team</p>
            </div>
        `,
    });
};

const sendPasswordResetOtpEmail = async ({ email, code, subject, accountLabel }) => {
    const accountCopy = accountLabel ? ` for your ${accountLabel}` : '';

    return sendEmail({
        to: email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Code</h2>
                <p>You requested a password reset${accountCopy}. Use the verification code below in the app to continue:</p>
                <div style="margin: 20px 0; padding: 16px; border-radius: 12px; background-color: #eef2ff; border: 1px solid #c7d2fe; text-align: center;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: #4338ca; font-weight: 700;">Reset code</p>
                    <p style="margin: 12px 0 0; font-size: 32px; letter-spacing: 0.32em; font-weight: 800; color: #1e1b4b;">${code}</p>
                </div>
                <p>This code expires in 10 minutes.</p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>Thank you,<br>The Mediflow Team</p>
            </div>
        `,
    });
};

const sendTwoFactorCodeEmail = async ({ email, code }) => sendEmail({
    to: email,
    subject: '2FA Verification Code - Mediflow',
    html: `<h3>Your 2FA code is: ${code}</h3><p>Use this code to complete your login.</p>`,
});

const sendWelcomeCredentialsEmail = async ({ email, tempPassword }) => sendEmail({
    to: email,
    subject: 'Welcome to Mediflow - Your Account Details',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Mediflow!</h2>
            <p>Your account has been created successfully.</p>
            <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                <p style="color: #d32f2f;"><strong>Please change your password after first login.</strong></p>
            </div>
            <p>You can now book appointments and manage your healthcare needs through our platform.</p>
            <p>Best regards,<br>Mediflow Team</p>
        </div>
    `,
});

const sendAppointmentReminderEmail = async ({ email, patientName, doctorName, slotTime, slotDate }) => sendEmail({
    to: email,
    subject: `Appointment Reminder - Dr. ${doctorName}`,
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Appointment Reminder</h2>
            <p>Dear ${patientName},</p>
            <p>This is a reminder for your upcoming appointment with <strong>Dr. ${doctorName}</strong>.</p>
            <p><strong>Time:</strong> ${slotTime} on ${slotDate.replace(/_/g, '/')}</p>
            <p>Please arrive 10 minutes before your scheduled time.</p>
            <p>Thank you,<br>The Mediflow Team</p>
        </div>
    `,
});

const sendOverdueInvoiceEmail = async ({ email, patientName, invoiceNumber, dueDate, totalAmount }) => sendEmail({
    to: email,
    subject: `Overdue Invoice Alert: ${invoiceNumber}`,
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Payment Reminder</h2>
            <p>Dear ${patientName},</p>
            <p>This is a reminder that your invoice <strong>${invoiceNumber}</strong> was due on ${new Date(dueDate).toDateString()}.</p>
            <p>Total Amount: <strong>$${totalAmount}</strong></p>
            <p>Please make the payment at your earliest convenience to avoid interruptions in service.</p>
            <p>Thank you,<br>Mediflow Admin</p>
        </div>
    `,
});

const logEmailFailure = (context, error) => {
    logger.warn(`Email delivery failed during ${context}`, { message: error.message });
};

export {
    createEmailTransporter,
    logEmailFailure,
    sendAppointmentReminderEmail,
    sendEmail,
    sendOverdueInvoiceEmail,
    sendPasswordResetEmail,
    sendPasswordResetOtpEmail,
    sendTwoFactorCodeEmail,
    sendVerificationEmail,
    sendWelcomeCredentialsEmail,
};
