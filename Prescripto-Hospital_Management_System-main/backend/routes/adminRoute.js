import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, appointmentAccept, addDoctor, allDoctors, adminDashboard, getAllPatients, updatePaymentStatus, getSettings, updateSettings, getPatientDetails, getAnalytics, updatePaymentMethods, updateDoctor, createPatientAdmin, generateInvoice, getAllInvoices, updateInvoiceStatus, downloadInvoicePDF, processRefund, getPaymentHistory, getPaymentKPIs, getBillingMetrics, getAdvancedAnalytics, exportFinancialsCSV, getAuditLogs } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.post("/accept-appointment", authAdmin, appointmentAccept)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)
adminRouter.get("/all-patients", authAdmin, getAllPatients)
adminRouter.post("/update-payment-status", authAdmin, updatePaymentStatus)
adminRouter.get("/get-settings", authAdmin, getSettings)
adminRouter.post("/update-settings", authAdmin, updateSettings)
adminRouter.get("/patient-details/:userId", authAdmin, getPatientDetails)
adminRouter.get("/analytics", authAdmin, getAnalytics)
adminRouter.post("/update-payment-methods", authAdmin, updatePaymentMethods)
adminRouter.put("/update-doctor", authAdmin, upload.single('image'), updateDoctor)
// Create patient (admin/staff)
adminRouter.post("/create-patient", authAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'aadharImage', maxCount: 1 }]), createPatientAdmin)

// Invoice management
adminRouter.post("/generate-invoice", authAdmin, generateInvoice)
adminRouter.get("/all-invoices", authAdmin, getAllInvoices)
adminRouter.post("/update-invoice-status", authAdmin, updateInvoiceStatus)
// Billing analytics
adminRouter.get("/billing-analytics", authAdmin, getBillingMetrics)
adminRouter.get("/payment-kpis", authAdmin, getPaymentKPIs)
adminRouter.get("/payment-history/:appointmentId", authAdmin, getPaymentHistory)
adminRouter.get("/export-financials", authAdmin, exportFinancialsCSV)
adminRouter.get("/advanced-analytics", authAdmin, getAdvancedAnalytics)
adminRouter.get("/audit-logs", authAdmin, getAuditLogs)

export default adminRouter;
