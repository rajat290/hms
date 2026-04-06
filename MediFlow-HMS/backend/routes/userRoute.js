import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe, verifyEmail, forgotPassword, resetPassword, enable2FA, verify2FA, refreshSession, logoutUser, getFinancialSummary, getUserPrescriptions, getDoctorSlots, rescheduleAppointment, getNotifications, markNotificationsRead } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import { authLimiter, forgotPasswordLimiter } from '../middleware/rateLimiters.js';
import { validateAppointmentId, validateAppointmentReschedule, validateBooking, validateDoctorIdParam, validateForgotPassword, validateLogin, validatePaginationQuery, validateRazorpayVerification, validateRefreshTokenPayload, validateResetPassword, validateStripeVerification, validateTokenPayload, validateUserActionSubject, validateUserProfileUpdate, validateUserRegistration, validate2FAVerification } from '../middleware/validators.js';
const userRouter = express.Router();

userRouter.post("/register", authLimiter, validateUserRegistration, registerUser)
userRouter.post("/login", authLimiter, validateLogin, loginUser)
userRouter.post("/refresh-session", validateRefreshTokenPayload, refreshSession)
userRouter.post("/logout", authUser, logoutUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, validateUserProfileUpdate, updateProfile)
userRouter.post("/book-appointment", authUser, validateBooking, bookAppointment)
userRouter.get("/appointments", authUser, validatePaginationQuery, listAppointment)
userRouter.post("/cancel-appointment", authUser, validateAppointmentId, cancelAppointment)
userRouter.post("/payment-razorpay", authUser, validateAppointmentId, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, validateRazorpayVerification, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, validateAppointmentId, paymentStripe)
userRouter.post("/verifyStripe", authUser, validateStripeVerification, verifyStripe)
userRouter.post("/verify-email", validateTokenPayload, verifyEmail)
userRouter.post("/forgot-password", forgotPasswordLimiter, validateForgotPassword, forgotPassword)
userRouter.post("/reset-password", forgotPasswordLimiter, validateResetPassword, resetPassword)
userRouter.post("/enable-2fa", authUser, validateUserActionSubject, enable2FA)
userRouter.post("/verify-2fa", authLimiter, validate2FAVerification, verify2FA)
userRouter.get("/financial-summary", authUser, getFinancialSummary)
userRouter.get("/prescriptions", authUser, validatePaginationQuery, getUserPrescriptions)
userRouter.get('/doctor-slots/:docId', validateDoctorIdParam, getDoctorSlots)
userRouter.post("/reschedule-appointment", authUser, validateAppointmentReschedule, rescheduleAppointment)
userRouter.get("/notifications", authUser, validatePaginationQuery, getNotifications)
userRouter.post("/mark-notifications-read", authUser, validateUserActionSubject, markNotificationsRead)

export default userRouter;
