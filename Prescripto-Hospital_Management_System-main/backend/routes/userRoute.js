import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe, verifyEmail, forgotPassword, resetPassword, enable2FA, verify2FA, getFinancialSummary, getUserPrescriptions, getDoctorSlots, rescheduleAppointment, getNotifications, markNotificationsRead } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)
userRouter.post("/verify-email", verifyEmail)
userRouter.post("/forgot-password", forgotPassword)
userRouter.post("/reset-password", resetPassword)
userRouter.post("/enable-2fa", authUser, enable2FA)
userRouter.post("/verify-2fa", authUser, verify2FA)
userRouter.get("/financial-summary", authUser, getFinancialSummary)
userRouter.get("/prescriptions", authUser, getUserPrescriptions)
userRouter.get('/doctor-slots/:docId', getDoctorSlots)
userRouter.post("/reschedule-appointment", authUser, rescheduleAppointment)
userRouter.get("/notifications", authUser, getNotifications)
userRouter.post("/mark-notifications-read", authUser, markNotificationsRead)

export default userRouter;
