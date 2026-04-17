import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, appointmentAccept, doctorList, changeAvailablity, appointmentComplete, startConsultation, doctorDashboard, doctorProfile, updateDoctorProfile, addAppointmentNotes, generatePrescriptionDoctor, getPatientFinancialSummary, getAvailability, updateAvailability, addReview, getDoctorReviews, forgotPassword, resetPassword, refreshSession, logoutDoctor, verifyEmail } from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import authUser from '../middleware/authUser.js';
import { authLimiter, forgotPasswordLimiter } from '../middleware/rateLimiters.js';
import { validateAppointmentId, validateDocId, validateDoctorAvailabilityUpdate, validateDoctorIdParam, validateDoctorListQuery, validateDoctorNote, validateDoctorProfileUpdate, validateForgotPassword, validateLogin, validatePaginationQuery, validatePatientFinancialRequest, validatePrescription, validateRefreshTokenPayload, validateResetPassword, validateReview, validateTokenPayload } from '../middleware/validators.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", authLimiter, validateLogin, loginDoctor)
doctorRouter.post("/refresh-session", validateRefreshTokenPayload, refreshSession)
doctorRouter.post("/logout", authDoctor, logoutDoctor)
doctorRouter.post("/verify-email", validateTokenPayload, verifyEmail)
doctorRouter.post("/cancel-appointment", authDoctor, validateAppointmentId, appointmentCancel)
doctorRouter.post("/accept-appointment", authDoctor, validateAppointmentId, appointmentAccept)
doctorRouter.post("/start-consultation", authDoctor, validateAppointmentId, startConsultation)
doctorRouter.get("/appointments", authDoctor, validatePaginationQuery, appointmentsDoctor)
doctorRouter.get("/list", validateDoctorListQuery, doctorList)
doctorRouter.post("/change-availability", authDoctor, validateDocId, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, validateAppointmentId, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, validateDoctorProfileUpdate, updateDoctorProfile)
doctorRouter.post("/add-notes", authDoctor, validateDoctorNote, addAppointmentNotes)
doctorRouter.post("/generate-prescription", authDoctor, validatePrescription, generatePrescriptionDoctor)
doctorRouter.post("/patient-financial", authDoctor, validatePatientFinancialRequest, getPatientFinancialSummary)
doctorRouter.post("/get-availability", authDoctor, validateDocId, getAvailability)
doctorRouter.post("/update-availability", authDoctor, validateDoctorAvailabilityUpdate, updateAvailability)
doctorRouter.get("/reviews/:docId", validateDoctorIdParam, validatePaginationQuery, getDoctorReviews)
doctorRouter.post("/add-review", authUser, validateReview, addReview) // Use authUser for patients
doctorRouter.post("/forgot-password", forgotPasswordLimiter, validateForgotPassword, forgotPassword)
doctorRouter.post("/reset-password", forgotPasswordLimiter, validateResetPassword, resetPassword)

export default doctorRouter;
