import express from 'express'
import { loginStaff, getProfile, updateProfile, getAllAppointments, cancelAppointment, getAllPatients, createPatient, staffDashboard, getDailyAppointments, markCheckIn, updatePayment, getStaffNotifications, markNotificationRead, forgotPassword, resetPassword, verifyEmail } from '../controllers/staffController.js'
import authStaff from '../middleware/authStaff.js'
import upload from '../middleware/multer.js';

const staffRouter = express.Router()

staffRouter.post('/login', loginStaff)
staffRouter.post('/verify-email', verifyEmail)
staffRouter.get('/profile', authStaff, getProfile)
staffRouter.post('/update-profile', authStaff, updateProfile)
staffRouter.get('/appointments', authStaff, getAllAppointments)
staffRouter.post('/cancel-appointment', authStaff, cancelAppointment)
staffRouter.get('/all-patients', authStaff, getAllPatients)
staffRouter.post('/create-patient', authStaff, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'aadharImage', maxCount: 1 }]), createPatient)
staffRouter.get('/dashboard', authStaff, staffDashboard)

staffRouter.get('/daily-appointments', authStaff, getDailyAppointments)
staffRouter.post('/mark-checkin', authStaff, markCheckIn)
staffRouter.post('/update-payment', authStaff, updatePayment)
staffRouter.get('/notifications', authStaff, getStaffNotifications)
staffRouter.post('/mark-notification-read', authStaff, markNotificationRead)
staffRouter.post('/forgot-password', forgotPassword)
staffRouter.post('/reset-password', resetPassword)

export default staffRouter
