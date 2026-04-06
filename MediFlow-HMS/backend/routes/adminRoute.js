import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, appointmentAccept, addDoctor, allDoctors, adminDashboard, getAllPatients, updatePaymentStatus, getSettings, updateSettings, getPatientDetails, getAnalytics, updatePaymentMethods, updateDoctor, createPatientAdmin, generateInvoice, getAllInvoices, updateInvoiceStatus, downloadInvoicePDF, processRefund, getPaymentHistory, getPaymentKPIs, getBillingMetrics, getAdvancedAnalytics, exportFinancialsCSV, getAuditLogs, addStaff, allStaff, deleteDoctor } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { validateAdminAddDoctor, validateAdminAddStaff, validateAppointmentId, validateAppointmentIdParam, validateDocId, validateDoctorDeleteParam, validateInvoiceIdParam, validateInvoiceStatusUpdate, validateLogin, validatePatientCreate, validatePaymentMethods, validateUpdateDoctor, validateUpdatePaymentStatus, validateUpdateSettings, validateUserIdParam } from '../middleware/validators.js';
const adminRouter = express.Router();

adminRouter.post("/login", authLimiter, validateLogin, loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), validateAdminAddDoctor, addDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, validateAppointmentId, appointmentCancel)
adminRouter.post("/accept-appointment", authAdmin, validateAppointmentId, appointmentAccept)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/add-staff", authAdmin, upload.single('image'), validateAdminAddStaff, addStaff)
adminRouter.get("/all-staff", authAdmin, allStaff)
adminRouter.post("/change-availability", authAdmin, validateDocId, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)
adminRouter.get("/all-patients", authAdmin, getAllPatients)
adminRouter.post("/update-payment-status", authAdmin, validateUpdatePaymentStatus, updatePaymentStatus)
adminRouter.get("/get-settings", authAdmin, getSettings)
adminRouter.post("/update-settings", authAdmin, validateUpdateSettings, updateSettings)
adminRouter.get("/patient-details/:userId", authAdmin, validateUserIdParam, getPatientDetails)
adminRouter.get("/analytics", authAdmin, getAnalytics)
adminRouter.post("/update-payment-methods", authAdmin, validatePaymentMethods, updatePaymentMethods)
adminRouter.put("/update-doctor", authAdmin, upload.single('image'), validateUpdateDoctor, updateDoctor)
// Create patient (admin/staff)
adminRouter.post("/create-patient", authAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'aadharImage', maxCount: 1 }]), validatePatientCreate, createPatientAdmin)

// Invoice management
adminRouter.post("/generate-invoice", authAdmin, validateAppointmentId, generateInvoice)
adminRouter.get("/all-invoices", authAdmin, getAllInvoices)
adminRouter.post("/update-invoice-status", authAdmin, validateInvoiceStatusUpdate, updateInvoiceStatus)
adminRouter.get("/download-invoice/:invoiceId", authAdmin, validateInvoiceIdParam, downloadInvoicePDF)
adminRouter.delete("/delete-doctor/:doctorId", authAdmin, validateDoctorDeleteParam, deleteDoctor)
// Billing analytics
adminRouter.get("/billing-analytics", authAdmin, getBillingMetrics)
adminRouter.get("/payment-kpis", authAdmin, getPaymentKPIs)
adminRouter.get("/payment-history/:appointmentId", authAdmin, validateAppointmentIdParam, getPaymentHistory)
adminRouter.get("/export-financials", authAdmin, exportFinancialsCSV)
adminRouter.get("/advanced-analytics", authAdmin, getAdvancedAnalytics)
adminRouter.get("/audit-logs", authAdmin, getAuditLogs)

export default adminRouter;
