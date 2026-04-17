import mongoose from 'mongoose'
import validator from 'validator'

const badRequest = (res, message) => res.status(400).json({ success: false, message })

const getValue = (req, source, field) => {
    if (source === 'params') return req.params?.[field]
    if (source === 'query') return req.query?.[field]
    return req.body?.[field]
}

const hasValue = (value) => value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')

const validate = (checks) => (req, res, next) => {
    for (const check of checks) {
        const message = check(req)
        if (message) {
            return badRequest(res, message)
        }
    }

    next()
}

const requireFields = (fields, source = 'body') => (req) => {
    for (const field of fields) {
        if (!hasValue(getValue(req, source, field))) {
            return `${field} is required`
        }
    }

    return null
}

const validateEmailField = (field, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (hasValue(value) && !validator.isEmail(String(value))) {
        return `${field} must be a valid email`
    }
    return null
}

const validatePasswordField = (field, minLength = 8, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (hasValue(value) && String(value).length < minLength) {
        return `${field} must be at least ${minLength} characters`
    }
    return null
}

const validateObjectIdField = (field, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (hasValue(value) && !mongoose.isValidObjectId(String(value))) {
        return `${field} must be a valid identifier`
    }
    return null
}

const validateEnumField = (field, values, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (hasValue(value) && !values.includes(value)) {
        return `${field} must be one of: ${values.join(', ')}`
    }
    return null
}

const validateNumberField = (field, { min, max, integer = false } = {}, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (!hasValue(value)) return null

    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) {
        return `${field} must be a valid number`
    }
    if (integer && !Number.isInteger(numericValue)) {
        return `${field} must be an integer`
    }
    if (min !== undefined && numericValue < min) {
        return `${field} must be at least ${min}`
    }
    if (max !== undefined && numericValue > max) {
        return `${field} must be at most ${max}`
    }
    return null
}

const validateStringLength = (field, { min, max } = {}, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (!hasValue(value) || typeof value !== 'string') return null

    if (min !== undefined && value.length < min) {
        return `${field} must be at least ${min} characters`
    }
    if (max !== undefined && value.length > max) {
        return `${field} must be at most ${max} characters`
    }
    return null
}

const validateObjectField = (field, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (!hasValue(value)) return null

    if (typeof value === 'string') {
        try {
            const parsedValue = JSON.parse(value)
            if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
                return `${field} must be a valid object`
            }
            return null
        } catch {
            return `${field} must be a valid object`
        }
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return `${field} must be a valid object`
    }

    return null
}

const validateArrayField = (field, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (!Array.isArray(value) || value.length === 0) {
        return `${field} must be a non-empty array`
    }
    return null
}

const validateBooleanLikeField = (field, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (!hasValue(value)) return null

    const normalizedValue = typeof value === 'string' ? value.toLowerCase() : value
    if (normalizedValue !== true && normalizedValue !== false && normalizedValue !== 'true' && normalizedValue !== 'false') {
        return `${field} must be a boolean value`
    }

    return null
}

const validateStringOrArrayField = (field, { min, max } = {}, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (!hasValue(value)) return null

    if (typeof value === 'string') {
        if (min !== undefined && value.trim().length < min) {
            return `${field} must be at least ${min} characters`
        }
        if (max !== undefined && value.trim().length > max) {
            return `${field} must be at most ${max} characters`
        }
        return null
    }

    if (Array.isArray(value) && value.length > 0) {
        return null
    }

    return `${field} must be a non-empty string or array`
}

const validateDateSlotFormat = (field, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (hasValue(value) && !/^\d{1,2}_\d{1,2}_\d{4}$/.test(String(value))) {
        return `${field} must be in dd_m_yyyy format`
    }
    return null
}

const validateTimeSlotFormat = (field, source = 'body') => (req) => {
    const value = getValue(req, source, field)
    if (hasValue(value) && !/^\d{2}:\d{2}$/.test(String(value))) {
        return `${field} must be in HH:MM format`
    }
    return null
}

const validatePaginationQuery = validate([
    validateNumberField('page', { min: 1, max: 100000, integer: true }, 'query'),
    validateNumberField('limit', { min: 1, max: 100, integer: true }, 'query'),
])

const validateOptionalSlotDateQuery = validate([
    validateDateSlotFormat('date', 'query'),
])

const validateDoctorListQuery = validate([
    validateStringLength('speciality', { min: 1, max: 100 }, 'query'),
    validateStringLength('gender', { min: 1, max: 30 }, 'query'),
    validateNumberField('maxFees', { min: 0, max: 1000000 }, 'query'),
    validateStringLength('search', { min: 1, max: 100 }, 'query'),
    validateNumberField('page', { min: 1, max: 100000, integer: true }, 'query'),
    validateNumberField('limit', { min: 1, max: 100, integer: true }, 'query'),
])

const validateUserRegistration = validate([
    requireFields(['name', 'email', 'password']),
    validateEmailField('email'),
    validatePasswordField('password'),
    validateStringLength('name', { min: 2, max: 100 }),
])

const validateLogin = validate([
    requireFields(['email', 'password']),
    validateEmailField('email'),
    validateStringLength('password', { min: 1, max: 200 }),
])

const validateTokenPayload = validate([
    requireFields(['token']),
    validateStringLength('token', { min: 8, max: 500 }),
])

const validateRefreshTokenPayload = validate([
    requireFields(['refreshToken']),
    validateStringLength('refreshToken', { min: 8, max: 1000 }),
])

const validateForgotPassword = validate([
    requireFields(['email']),
    validateEmailField('email'),
])

const validateResetOtpVerification = validate([
    requireFields(['email', 'code']),
    validateEmailField('email'),
    validateStringLength('code', { min: 6, max: 6 }),
])

const validateResetPassword = validate([
    requireFields(['token', 'newPassword']),
    validateStringLength('token', { min: 8, max: 500 }),
    validatePasswordField('newPassword'),
])

const validateAppointmentId = validate([
    requireFields(['appointmentId']),
    validateObjectIdField('appointmentId'),
])

const validateBooking = validate([
    requireFields(['docId', 'slotDate', 'slotTime']),
    validateObjectIdField('docId'),
    validateDateSlotFormat('slotDate'),
    validateTimeSlotFormat('slotTime'),
    validateEnumField('paymentMethod', ['Cash', 'Online']),
])

const validateRazorpayVerification = validate([
    requireFields(['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']),
    validateStringLength('razorpay_order_id', { min: 5, max: 200 }),
    validateStringLength('razorpay_payment_id', { min: 5, max: 200 }),
    validateStringLength('razorpay_signature', { min: 10, max: 500 }),
])

const validateStripeVerification = validate([
    requireFields(['appointmentId', 'sessionId']),
    validateObjectIdField('appointmentId'),
    validateStringLength('sessionId', { min: 5, max: 500 }),
])

const validateAppointmentReschedule = validate([
    requireFields(['appointmentId', 'newSlotDate', 'newSlotTime']),
    validateObjectIdField('appointmentId'),
    validateDateSlotFormat('newSlotDate'),
    validateTimeSlotFormat('newSlotTime'),
])

const validate2FASetup = validate([
    requireFields(['code']),
    validateStringLength('code', { min: 6, max: 6 }),
])

const validate2FAVerification = validate([
    requireFields(['userId', 'code']),
    validateObjectIdField('userId'),
    validateStringLength('code', { min: 6, max: 6 }),
])

const validateDoctorIdParam = validate([
    requireFields(['docId'], 'params'),
    validateObjectIdField('docId', 'params'),
])

const validateDocId = validate([
    requireFields(['docId']),
    validateObjectIdField('docId'),
])

const validateUserIdParam = validate([
    requireFields(['userId'], 'params'),
    validateObjectIdField('userId', 'params'),
])

const validateInvoiceIdParam = validate([
    requireFields(['invoiceId'], 'params'),
    validateObjectIdField('invoiceId', 'params'),
])

const validateAppointmentIdParam = validate([
    requireFields(['appointmentId'], 'params'),
    validateObjectIdField('appointmentId', 'params'),
])

const validateDoctorDeleteParam = validate([
    requireFields(['doctorId'], 'params'),
    validateObjectIdField('doctorId', 'params'),
])

const validateReview = validate([
    requireFields(['docId', 'appointmentId', 'rating', 'comment']),
    validateObjectIdField('docId'),
    validateObjectIdField('appointmentId'),
    validateNumberField('rating', { min: 1, max: 5 }),
    validateStringLength('comment', { min: 3, max: 1000 }),
])

const validateDoctorNote = validate([
    requireFields(['docId', 'appointmentId', 'notes']),
    validateObjectIdField('docId'),
    validateObjectIdField('appointmentId'),
    validateStringLength('notes', { min: 1, max: 2000 }),
])

const validatePrescription = validate([
    requireFields(['docId', 'appointmentId']),
    validateObjectIdField('docId'),
    validateObjectIdField('appointmentId'),
    validateArrayField('medicines'),
])

const validatePatientFinancialRequest = validate([
    requireFields(['docId', 'userId']),
    validateObjectIdField('docId'),
    validateObjectIdField('userId'),
])

const validateDoctorAvailabilityUpdate = validate([
    requireFields(['docId', 'availability']),
    validateObjectIdField('docId'),
    validateObjectField('availability'),
])

const validateUserProfileUpdate = validate([
    requireFields(['userId']),
    validateObjectIdField('userId'),
    validateStringLength('name', { min: 2, max: 100 }),
    validateStringLength('phone', { min: 6, max: 20 }),
    validateStringLength('gender', { min: 1, max: 30 }),
    validateObjectField('address'),
    validateStringLength('bloodGroup', { max: 10 }),
    validateStringLength('knownAllergies', { max: 2000 }),
    validateStringLength('currentMedications', { max: 2000 }),
    validateObjectField('emergencyContact'),
    validateStringLength('insuranceProvider', { max: 100 }),
    validateStringLength('insuranceId', { max: 100 }),
])

const validateUserActionSubject = validate([
    requireFields(['userId']),
    validateObjectIdField('userId'),
])

const validateStaffProfileUpdate = validate([
    requireFields(['staffId']),
    validateObjectIdField('staffId'),
    validateStringLength('name', { min: 2, max: 100 }),
    validateStringLength('phone', { min: 6, max: 20 }),
])

const validateDoctorProfileUpdate = validate([
    requireFields(['docId']),
    validateObjectIdField('docId'),
    validateNumberField('fees', { min: 0 }),
    validateObjectField('address'),
    validateBooleanLikeField('available'),
])

const validateAdminAddDoctor = validate([
    requireFields(['name', 'email', 'password', 'speciality', 'degree', 'experience', 'about', 'fees', 'address']),
    validateEmailField('email'),
    validatePasswordField('password'),
    validateNumberField('fees', { min: 0 }),
])

const validateAdminAddStaff = validate([
    requireFields(['name', 'email', 'password']),
    validateEmailField('email'),
    validatePasswordField('password'),
])

const validatePatientCreate = validate([
    requireFields(['name', 'email', 'phone', 'dob', 'gender']),
    validateEmailField('email'),
    validateStringLength('name', { min: 2, max: 100 }),
    validateStringLength('phone', { min: 6, max: 20 }),
])

const validateUpdateSettings = validate([
    requireFields(['cancellationWindow']),
    validateNumberField('cancellationWindow', { min: 1, max: 168, integer: true }),
])

const validateUpdatePaymentStatus = validate([
    requireFields(['appointmentId', 'paymentStatus']),
    validateObjectIdField('appointmentId'),
    validateEnumField('paymentStatus', ['paid', 'partially paid', 'unpaid', 'refunded']),
])

const validatePaymentMethods = validate([
    requireFields(['docId', 'paymentMethods']),
    validateObjectIdField('docId'),
    validateObjectField('paymentMethods'),
])

const validateInvoiceId = validate([
    requireFields(['invoiceId']),
    validateObjectIdField('invoiceId'),
])

const validateUpdateDoctor = validate([
    requireFields(['docId', 'name', 'email', 'experience', 'fees', 'about', 'speciality', 'degree', 'address']),
    validateObjectIdField('docId'),
    validateEmailField('email'),
    validateNumberField('fees', { min: 0 }),
])

const validateInvoiceStatusUpdate = validate([
    requireFields(['invoiceId', 'status']),
    validateObjectIdField('invoiceId'),
    validateEnumField('status', ['paid', 'unpaid', 'overdue', 'cancelled', 'partially paid', 'refunded']),
])

const validateRefund = validate([
    requireFields(['appointmentId', 'refundAmount', 'reason']),
    validateObjectIdField('appointmentId'),
    validateNumberField('refundAmount', { min: 1 }),
    validateStringLength('reason', { min: 3, max: 1000 }),
])

const validateNotificationId = validate([
    requireFields(['notificationId']),
    validateObjectIdField('notificationId'),
])

const validateAIChat = validate([
    requireFields(['message']),
    validateStringLength('message', { min: 1, max: 4000 }),
])

const validateAISymptoms = validate([
    requireFields(['symptoms']),
    validateStringOrArrayField('symptoms', { min: 3, max: 2000 }),
])

const validateAISchedule = validate([
    requireFields(['doctorId', 'date']),
    validateObjectIdField('doctorId'),
    validateStringLength('date', { min: 4, max: 50 }),
])

export {
    validateUserRegistration,
    validateLogin,
    validatePaginationQuery,
    validateOptionalSlotDateQuery,
    validateDoctorListQuery,
    validateTokenPayload,
    validateRefreshTokenPayload,
    validateForgotPassword,
    validateResetOtpVerification,
    validateResetPassword,
    validateAppointmentId,
    validateBooking,
    validateRazorpayVerification,
    validateStripeVerification,
    validateAppointmentReschedule,
    validate2FASetup,
    validate2FAVerification,
    validateDoctorIdParam,
    validateDocId,
    validateUserIdParam,
    validateInvoiceIdParam,
    validateAppointmentIdParam,
    validateDoctorDeleteParam,
    validateReview,
    validateDoctorNote,
    validatePrescription,
    validatePatientFinancialRequest,
    validateDoctorAvailabilityUpdate,
    validateUserProfileUpdate,
    validateUserActionSubject,
    validateStaffProfileUpdate,
    validateDoctorProfileUpdate,
    validateAdminAddDoctor,
    validateAdminAddStaff,
    validatePatientCreate,
    validateUpdateSettings,
    validateUpdatePaymentStatus,
    validatePaymentMethods,
    validateInvoiceId,
    validateUpdateDoctor,
    validateInvoiceStatusUpdate,
    validateRefund,
    validateNotificationId,
    validateAIChat,
    validateAISymptoms,
    validateAISchedule,
}
