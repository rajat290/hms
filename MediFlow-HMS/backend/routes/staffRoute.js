import express from 'express'
import { loginStaff, getProfile, updateProfile, getAllAppointments, cancelAppointment, getAllPatients, createPatient, staffDashboard, getDailyAppointments, markCheckIn, updatePayment, getStaffNotifications, markNotificationRead, forgotPassword, verifyResetOtp, resetPassword, refreshSession, logoutStaff, verifyEmail } from '../controllers/staffController.js'
import authStaff from '../middleware/authStaff.js'
import upload from '../middleware/multer.js';
import { authLimiter, forgotPasswordLimiter } from '../middleware/rateLimiters.js';
import { validateAppointmentId, validateBackofficePatientCreate, validateForgotPassword, validateLogin, validateNotificationId, validateOptionalSlotDateQuery, validatePaginationQuery, validateRefreshTokenPayload, validateResetOtpVerification, validateResetPassword, validateStaffProfileUpdate, validateTokenPayload, validateUpdatePaymentStatus } from '../middleware/validators.js';

const staffRouter = express.Router()

staffRouter.post('/login', authLimiter, validateLogin, loginStaff)
staffRouter.post('/refresh-session', validateRefreshTokenPayload, refreshSession)
staffRouter.post('/logout', authStaff, logoutStaff)
staffRouter.post('/verify-email', validateTokenPayload, verifyEmail)
staffRouter.get('/profile', authStaff, getProfile)
staffRouter.post('/update-profile', authStaff, validateStaffProfileUpdate, updateProfile)
staffRouter.get('/appointments', authStaff, validatePaginationQuery, getAllAppointments)
staffRouter.post('/cancel-appointment', authStaff, validateAppointmentId, cancelAppointment)
staffRouter.get('/all-patients', authStaff, validatePaginationQuery, getAllPatients)
staffRouter.post('/create-patient', authStaff, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'aadharImage', maxCount: 1 }]), validateBackofficePatientCreate, createPatient)
staffRouter.get('/dashboard', authStaff, staffDashboard)

staffRouter.get('/daily-appointments', authStaff, validateOptionalSlotDateQuery, validatePaginationQuery, getDailyAppointments)
staffRouter.post('/mark-checkin', authStaff, validateAppointmentId, markCheckIn)
staffRouter.post('/update-payment', authStaff, validateUpdatePaymentStatus, updatePayment)
staffRouter.get('/notifications', authStaff, validatePaginationQuery, getStaffNotifications)
staffRouter.post('/mark-notification-read', authStaff, validateNotificationId, markNotificationRead)
staffRouter.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword)
staffRouter.post('/verify-reset-otp', forgotPasswordLimiter, validateResetOtpVerification, verifyResetOtp)
staffRouter.post('/reset-password', forgotPasswordLimiter, validateResetPassword, resetPassword)

export default staffRouter
