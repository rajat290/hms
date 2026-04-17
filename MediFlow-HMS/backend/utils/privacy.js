import crypto from 'crypto';
import {
    sanitizeAppointmentForClient,
    sanitizeUserForClient,
} from './clientSanitizers.js';

const DEFAULT_PRIVACY_POLICY_VERSION = '2026-04';
const DEFAULT_DELETION_REVIEW_WINDOW_DAYS = 30;
const AADHAAR_DIGIT_COUNT = 12;

const normalizeAadhaarNumber = (value) => {
    const normalizedValue = String(value || '').replace(/\D/g, '');

    if (!normalizedValue) {
        return '';
    }

    if (normalizedValue.length !== AADHAAR_DIGIT_COUNT) {
        throw new Error('Aadhaar number must contain exactly 12 digits');
    }

    return normalizedValue;
};

const maskAadhaarNumber = (value) => {
    const normalizedValue = normalizeAadhaarNumber(value);

    if (!normalizedValue) {
        return '';
    }

    return `XXXX XXXX ${normalizedValue.slice(-4)}`;
};

const hashAadhaarNumber = (value) => {
    const normalizedValue = normalizeAadhaarNumber(value);

    if (!normalizedValue) {
        return '';
    }

    return crypto.createHash('sha256').update(normalizedValue).digest('hex');
};

const buildAadhaarRecord = (value) => {
    const normalizedValue = normalizeAadhaarNumber(value);

    if (!normalizedValue) {
        return {};
    }

    return {
        aadharHash: hashAadhaarNumber(normalizedValue),
        aadharMasked: maskAadhaarNumber(normalizedValue),
    };
};

const getPrivacyPolicyVersion = (settings) => (
    String(settings?.privacyPolicyVersion || DEFAULT_PRIVACY_POLICY_VERSION)
);

const getDeletionReviewWindowDays = (settings) => {
    const value = Number(settings?.deletionReviewWindowDays);
    return Number.isFinite(value) && value > 0
        ? value
        : DEFAULT_DELETION_REVIEW_WINDOW_DAYS;
};

const buildPrivacyConsentRecord = ({
    version,
    source = 'patient_portal',
    acceptedAt = new Date(),
}) => ({
    acceptedAt,
    version,
    source,
});

const isPrivacyConsentCurrent = ({ consent, settings }) => (
    Boolean(consent?.acceptedAt) && consent?.version === getPrivacyPolicyVersion(settings)
);

const anonymizeUserForDeletion = (user) => {
    const anonymizedAt = new Date();
    const deletedLabel = `Deleted User ${String(user._id).slice(-6)}`;

    user.name = deletedLabel;
    user.email = `deleted+${String(user._id)}@privacy.mediflow.invalid`;
    user.phone = '';
    user.image = '';
    user.address = {
        line1: '',
        line2: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
    };
    user.gender = 'Not Selected';
    user.dob = 'Not Selected';
    user.isVerified = false;
    user.verificationToken = undefined;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.twoFactorEnabled = false;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpiry = undefined;
    user.insuranceProvider = '';
    user.insuranceId = '';
    user.subscriptionPlan = 'none';
    user.subscriptionExpiry = undefined;
    user.bloodGroup = '';
    user.knownAllergies = '';
    user.currentMedications = '';
    user.chronicConditions = '';
    user.medicalHistory = [];
    user.familyMembers = [];
    user.aadharNumber = undefined;
    user.aadharHash = '';
    user.aadharMasked = '';
    user.aadharImage = '';
    user.emergencyContact = {
        name: '',
        phone: '',
        relation: '',
    };
    user.accountStatus = 'anonymized';
    user.deletionRequestedAt = user.deletionRequestedAt || anonymizedAt;
    user.anonymizedAt = anonymizedAt;
};

const buildFinancialSummary = (appointments = []) => appointments.reduce((summary, appointment) => {
    const paidAmount = appointment.paymentStatus === 'paid'
        ? appointment.amount
        : appointment.paymentStatus === 'partially paid'
            ? (appointment.partialAmount || 0)
            : 0;
    const pendingAmount = Math.max(appointment.amount - paidAmount, 0);

    return {
        totalAppointments: summary.totalAppointments + 1,
        totalPaid: summary.totalPaid + paidAmount,
        pendingDues: summary.pendingDues + pendingAmount,
    };
}, {
    totalAppointments: 0,
    totalPaid: 0,
    pendingDues: 0,
});

const buildPrivacyExportPayload = ({
    user,
    appointments = [],
    prescriptions = [],
    privacyRequests = [],
    settings,
}) => {
    const exportedAt = new Date().toISOString();
    const profile = sanitizeUserForClient(user, { viewer: 'self' });
    const appointmentHistory = appointments.map((appointment) => sanitizeAppointmentForClient(appointment));
    const financialSummary = buildFinancialSummary(appointments);

    return {
        exportedAt,
        policyVersion: getPrivacyPolicyVersion(settings),
        accountStatus: user?.accountStatus || 'active',
        profile,
        financialSummary,
        appointments: appointmentHistory,
        prescriptions,
        privacyRequests,
    };
};

export {
    AADHAAR_DIGIT_COUNT,
    DEFAULT_DELETION_REVIEW_WINDOW_DAYS,
    DEFAULT_PRIVACY_POLICY_VERSION,
    anonymizeUserForDeletion,
    buildAadhaarRecord,
    buildFinancialSummary,
    buildPrivacyConsentRecord,
    buildPrivacyExportPayload,
    getDeletionReviewWindowDays,
    getPrivacyPolicyVersion,
    hashAadhaarNumber,
    isPrivacyConsentCurrent,
    maskAadhaarNumber,
    normalizeAadhaarNumber,
};
