import express from 'express'
import { loginStaff, getProfile, updateProfile, getAllAppointments, cancelAppointment, getAllPatients, createPatient, staffDashboard, getDailyAppointments, markCheckIn, updatePayment, getStaffNotifications, markNotificationRead, forgotPassword, resetPassword, verifyEmail } from '../controllers/staffController.js'
import authStaff from '../middleware/authStaff.js'
import upload from '../middleware/multer.js';
import { authLimiter, forgotPasswordLimiter } from '../middleware/rateLimiters.js';
import { validateAppointmentId, validateForgotPassword, validateLogin, validateNotificationId, validatePatientCreate, validateResetPassword, validateStaffProfileUpdate, validateTokenPayload, validateUpdatePaymentStatus } from '../middleware/validators.js';

const staffRouter = express.Router()

staffRouter.post('/login', authLimiter, validateLogin, loginStaff)
staffRouter.post('/verify-email', validateTokenPayload, verifyEmail)
staffRouter.get('/profile', authStaff, getProfile)
staffRouter.post('/update-profile', authStaff, validateStaffProfileUpdate, updateProfile)
staffRouter.get('/appointments', authStaff, getAllAppointments)
staffRouter.post('/cancel-appointment', authStaff, validateAppointmentId, cancelAppointment)
staffRouter.get('/all-patients', authStaff, getAllPatients)
staffRouter.post('/create-patient', authStaff, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'aadharImage', maxCount: 1 }]), validatePatientCreate, createPatient)
staffRouter.get('/dashboard', authStaff, staffDashboard)

staffRouter.get('/daily-appointments', authStaff, getDailyAppointments)
staffRouter.post('/mark-checkin', authStaff, validateAppointmentId, markCheckIn)
staffRouter.post('/update-payment', authStaff, validateUpdatePaymentStatus, updatePayment)
staffRouter.get('/notifications', authStaff, getStaffNotifications)
staffRouter.post('/mark-notification-read', authStaff, validateNotificationId, markNotificationRead)
staffRouter.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword)
staffRouter.post('/reset-password', forgotPasswordLimiter, validateResetPassword, resetPassword)

export default staffRouter
