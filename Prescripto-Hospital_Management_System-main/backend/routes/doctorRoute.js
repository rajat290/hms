import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, appointmentAccept, doctorList, changeAvailablity, appointmentComplete, doctorDashboard, doctorProfile, updateDoctorProfile, addAppointmentNotes, generatePrescriptionDoctor, getPatientFinancialSummary, getAvailability, updateAvailability, addReview, getDoctorReviews } from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import authUser from '../middleware/authUser.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.post("/accept-appointment", authDoctor, appointmentAccept)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)
doctorRouter.post("/add-notes", authDoctor, addAppointmentNotes)
doctorRouter.post("/generate-prescription", authDoctor, generatePrescriptionDoctor)
doctorRouter.post("/patient-financial", authDoctor, getPatientFinancialSummary)
doctorRouter.post("/get-availability", authDoctor, getAvailability)
doctorRouter.post("/update-availability", authDoctor, updateAvailability)
doctorRouter.get("/reviews/:docId", getDoctorReviews)
doctorRouter.post("/add-review", authUser, addReview) // Use authUser for patients

export default doctorRouter;