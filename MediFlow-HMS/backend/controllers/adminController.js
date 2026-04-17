import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import settingsModel from "../models/settingsModel.js";
import userModel from "../models/userModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import paymentLogModel from "../models/paymentLogModel.js";
import invoiceModel from "../models/invoiceModel.js";
import staffModel from "../models/staffModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import PDFDocument from 'pdfkit';
import auditLogModel from "../models/auditLogModel.js";
import { cancelAppointmentRecord, ensureInvoiceForAppointmentId, normalizeAppointmentPaymentMethod, normalizePaymentLogMethod, refundAppointmentPayment } from "../utils/appointmentIntegrity.js";
import { deriveVisitStatusFromLegacyFlags, transitionAppointmentVisitStatus, VISIT_STATUS } from "../utils/appointmentLifecycle.js";
import { sendPaginatedResponse } from "../utils/pagination.js";
import { getAdminSubjectId, issueAuthTokens, revokeSessionById, rotateRefreshSession } from "../utils/authSessions.js";
import { sanitizeUserForClient } from "../utils/clientSanitizers.js";
import {
    clearBackofficeSessionCookies,
    getRefreshTokenFromRequest,
    setSessionCookies,
} from "../utils/sessionCookies.js";
import { runInTransaction } from "../utils/transaction.js";
import {
    getAdminDashboardData,
    getPaginatedAppointmentsForAdmin,
    getPaginatedAuditLogs,
    getPaginatedDoctorsForAdmin,
    getPaginatedInvoicesForAdmin,
    getPaginatedPatientsForAdmin,
    getPaginatedPaymentHistory,
    getPaginatedStaffForAdmin,
} from "../services/admin/adminReadService.js";
import { createPatientOnboarding } from "../services/patients/patientOnboardingService.js";

// Helper function for audit logging
const logAdminAction = async (actorEmail, action, targetType, targetId, metadata) => {
    try {
        await auditLogModel.create({
            actorEmail,
            action,
            targetType,
            targetId,
            metadata,
        });
    } catch (error) {
        console.error("Audit log failed:", error);
    }
}

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const session = await issueAuthTokens({
                subjectId: getAdminSubjectId(),
                role: 'admin',
                req,
            });
            clearBackofficeSessionCookies(res);
            setSessionCookies(res, 'admin', session);
            res.json({ success: true, ...session })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

const getAdminSession = async (req, res) => {
    res.json({
        success: true,
        admin: {
            email: process.env.ADMIN_EMAIL,
            role: 'admin',
        },
    });
}

const refreshSession = async (req, res) => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req, 'admin');
        const session = await rotateRefreshSession(refreshToken, 'admin', req);
        setSessionCookies(res, 'admin', session);

        res.json({ success: true, ...session });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: error.message || 'Session refresh failed' });
    }
}

const logoutAdmin = async (req, res) => {
    try {
        await revokeSessionById(req.auth?.sessionId, 'Admin logout');
        clearBackofficeSessionCookies(res);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {
        const response = await getPaginatedAppointmentsForAdmin(req.query);
        sendPaginatedResponse(res, response);

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body

        await runInTransaction(async (session) => {
            await cancelAppointmentRecord({ appointmentId, session, reason: 'Cancelled by admin' })
        })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }


}

// API for appointment acceptance
const appointmentAccept = async (req, res) => {
    try {
        const { appointmentId } = req.body

        await runInTransaction(async (session) => {
            const appointmentData = await appointmentModel.findById(appointmentId).session(session)

            if (!appointmentData) {
                throw new Error('Appointment not found')
            }

            transitionAppointmentVisitStatus({
                appointment: appointmentData,
                nextStatus: VISIT_STATUS.ACCEPTED,
                allowedFrom: [VISIT_STATUS.REQUESTED],
            })

            await appointmentData.save({ session })
        })

        res.json({ success: true, message: 'Appointment confirmed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get Settings
const getSettings = async (req, res) => {
    try {
        let settings = await settingsModel.findOne({})
        if (!settings) {
            settings = await settingsModel.create({ cancellationWindow: 24 })
        }

        res.json({ success: true, settings })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update Settings
const updateSettings = async (req, res) => {
    try {
        const { cancellationWindow } = req.body;

        if (!cancellationWindow || cancellationWindow < 1 || cancellationWindow > 168) {
            return res.json({ success: false, message: 'Cancellation window must be between 1 and 168 hours' });
        }

        let settings = await settingsModel.findOne({})
        if (!settings) {
            settings = await settingsModel.create({ cancellationWindow })
        } else {
            settings.cancellationWindow = cancellationWindow
            await settings.save()
        }

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get patient details
const getPatientDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, patient: sanitizeUserForClient(user, { viewer: 'admin' }) });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get analytics data
const getAnalytics = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({}).populate('docId', 'name speciality image');

        const totalAppointments = appointments.length;
        let totalRevenue = 0;
        let monthRevenue = 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const statusCounts = {
            Pending: 0,
            Completed: 0,
            Cancelled: 0,
            Accepted: 0,
            'Checked In': 0,
            'In Consultation': 0,
        };

        const revenueByDateMap = {};
        const doctorPerformance = {};

        // Get past 30 days dates
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            revenueByDateMap[dateKey] = { _id: dateKey, revenue: 0, count: 0 };
        }

        appointments.forEach(apt => {
            const amount = apt.amount || 0;
            const aptDate = new Date(apt.date);

            // Revenue calculation
            if (apt.payment || apt.isCompleted || apt.paymentStatus === 'paid') {
                totalRevenue += amount;

                if (aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear) {
                    monthRevenue += amount;
                }

                const dateKey = aptDate.toISOString().split('T')[0];
                if (revenueByDateMap[dateKey]) {
                    revenueByDateMap[dateKey].revenue += amount;
                    revenueByDateMap[dateKey].count += 1;
                }
            }

            // Status counts
            const visitStatus = deriveVisitStatusFromLegacyFlags(apt);
            if (visitStatus === VISIT_STATUS.CANCELLED) {
                statusCounts.Cancelled += 1;
            } else if (visitStatus === VISIT_STATUS.COMPLETED) {
                statusCounts.Completed += 1;
            } else if (visitStatus === VISIT_STATUS.IN_CONSULTATION) {
                statusCounts['In Consultation'] += 1;
            } else if (visitStatus === VISIT_STATUS.CHECKED_IN) {
                statusCounts['Checked In'] += 1;
            } else if (visitStatus === VISIT_STATUS.ACCEPTED) {
                statusCounts.Accepted += 1;
            } else {
                statusCounts.Pending += 1;
            }

            // Doctor performance
            const docId = apt.docId?._id?.toString();
            if (docId) {
                if (!doctorPerformance[docId]) {
                    doctorPerformance[docId] = {
                        doctor: apt.docId,
                        revenue: 0,
                        appointments: 0
                    };
                }
                doctorPerformance[docId].appointments += 1;
                if (apt.payment || apt.isCompleted || apt.paymentStatus === 'paid') {
                    doctorPerformance[docId].revenue += amount;
                }
            }
        });

        const revenueByDate = Object.values(revenueByDateMap).sort((a, b) => a._id.localeCompare(b._id));
        const topDoctors = Object.values(doctorPerformance).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        res.json({
            success: true,
            totalRevenue,
            monthRevenue,
            totalAppointments,
            statusCounts,
            revenueByDate,
            topDoctors
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to add doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Check if doctor already exists
        const existingDoctor = await doctorModel.findOne({ email });
        if (existingDoctor) {
            return res.json({ success: false, message: "Doctor with this email already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        const doctorData = {
            name,
            email,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: typeof address === 'string' ? JSON.parse(address) : address,
            image: imageUrl,
            date: Date.now()
        };

        const doctor = new doctorModel(doctorData);
        await doctor.save();

        await logAdminAction(process.env.ADMIN_EMAIL, 'ADD_DOCTOR', 'doctor', doctor._id, { name });

        res.json({ success: true, message: "Doctor added successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all doctors list
const allDoctors = async (req, res) => {
    try {
        const response = await getPaginatedDoctorsForAdmin(req.query);
        sendPaginatedResponse(res, response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get admin dashboard data
const adminDashboard = async (req, res) => {
    try {
        const dashData = await getAdminDashboardData();

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all patients
const getAllPatients = async (req, res) => {
    try {
        const response = await getPaginatedPatientsForAdmin(req.query);
        sendPaginatedResponse(res, response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update payment status (Admin)
const updatePaymentStatus = async (req, res) => {
    try {
        const { appointmentId, paymentStatus, partialAmount, paymentMethod = 'cash', notes = '' } = req.body;

        await runInTransaction(async (session) => {
            const appointment = await appointmentModel.findById(appointmentId).session(session);
            if (!appointment) {
                throw new Error('Appointment not found');
            }

            if (paymentStatus === 'refunded') {
                const amountToRefund = appointment.partialAmount || (appointment.payment ? appointment.amount : 0);

                await refundAppointmentPayment({
                    appointmentId,
                    refundAmount: amountToRefund,
                    reason: notes || 'Refund processed from payment status update',
                    processedBy: process.env.ADMIN_EMAIL,
                    session,
                });

                return;
            }

            const previousPartialAmount = appointment.partialAmount || 0;
            let logAmount = 0;

            if (paymentStatus === 'partially paid') {
                if (!partialAmount || partialAmount <= 0) {
                    throw new Error('Valid partial amount required');
                }

                const updatedPartialAmount = (appointment.partialAmount || 0) + Number(partialAmount);
                if (updatedPartialAmount >= appointment.amount) {
                    throw new Error('Partial amount must be less than total amount');
                }

                appointment.partialAmount = updatedPartialAmount;
                appointment.payment = false;
                appointment.paymentStatus = 'partially paid';
                logAmount = Number(partialAmount);
            } else if (paymentStatus === 'paid') {
                appointment.payment = true;
                appointment.partialAmount = appointment.amount;
                appointment.paymentStatus = 'paid';
                logAmount = Math.max(appointment.amount - previousPartialAmount, 0);
            } else {
                appointment.payment = false;
                appointment.partialAmount = 0;
                appointment.paymentStatus = 'unpaid';
            }

            appointment.paymentMethod = normalizeAppointmentPaymentMethod(paymentMethod);
            appointment.invoiceDate = new Date();
            await appointment.save({ session });
            await ensureInvoiceForAppointmentId(appointmentId, session);

            if (logAmount > 0) {
                await paymentLogModel.create([{
                    appointmentId,
                    patientId: appointment.userId,
                    amount: logAmount,
                    type: paymentStatus === 'paid' ? 'payment' : 'partial_payment',
                    method: normalizePaymentLogMethod(paymentMethod),
                    status: 'completed',
                    notes,
                    processedBy: process.env.ADMIN_EMAIL
                }], { session, ordered: true });
            }
        });

        res.json({ success: true, message: 'Payment status updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update payment methods for doctor
const updatePaymentMethods = async (req, res) => {
    try {
        const { docId, paymentMethods } = req.body;

        if (!paymentMethods.cash && !paymentMethods.online) {
            return res.json({ success: false, message: 'At least one payment method must be enabled' });
        }

        await doctorModel.findByIdAndUpdate(docId, { paymentMethods });
        res.json({ success: true, message: 'Payment methods updated successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update doctor profile from Admin Panel
const updateDoctor = async (req, res) => {
    try {
        const { docId, name, email, experience, fees, about, speciality, degree, address } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!docId || !name || !email || !experience || !fees || !about || !speciality || !degree || !address) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Check if doctor exists
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Prepare update data
        const updateData = {
            name,
            email,
            experience,
            fees: Number(fees),
            about,
            speciality,
            degree,
            address: typeof address === 'string' ? JSON.parse(address) : address
        };

        // Handle image upload if provided
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            updateData.image = imageUpload.secure_url;
        }

        // Update doctor in database
        await doctorModel.findByIdAndUpdate(docId, updateData, { new: true });

        res.json({ success: true, message: 'Doctor updated successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to create patient (admin/staff)
const createPatientAdmin = async (req, res) => {
    try {
        const { patient, credentials } = await createPatientOnboarding({
            input: req.body,
            files: req.files,
            options: {
                requiredFields: ['name', 'email', 'phone', 'dob', 'gender', 'medicalRecordNumber', 'aadharNumber', 'address'],
                missingFieldsMessage: 'All required fields must be provided',
                duplicateMessage: 'Patient with this email, phone, MRN, or Aadhaar already exists',
            },
        });

        res.json({
            success: true,
            message: 'Patient created successfully',
            patient: sanitizeUserForClient({
                _id: patient._id,
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                medicalRecordNumber: patient.medicalRecordNumber,
                aadharNumber: patient.aadharNumber,
                insuranceId: patient.insuranceId,
            }, { viewer: 'admin' }),
            credentials: {
                email: credentials.email,
                password: credentials.password
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to generate invoice
const generateInvoice = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const invoice = await runInTransaction(async (session) => {
            const appointment = await appointmentModel.findById(appointmentId).session(session);

            if (!appointment) {
                throw new Error('Appointment not found');
            }

            return ensureInvoiceForAppointmentId(appointmentId, session);
        });

        res.json({ success: true, message: 'Invoice generated successfully', invoice });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all invoices
const getAllInvoices = async (req, res) => {
    try {
        const response = await getPaginatedInvoicesForAdmin(req.query);
        sendPaginatedResponse(res, response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update invoice status
const updateInvoiceStatus = async (req, res) => {
    try {
        const { invoiceId, status } = req.body;

        await invoiceModel.findByIdAndUpdate(invoiceId, { status });
        res.json({ success: true, message: 'Invoice status updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to download invoice PDF
const downloadInvoicePDF = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await invoiceModel.findById(invoiceId)
            .populate('patientId', 'name email phone address')
            .populate('appointmentId', 'slotDate slotTime');

        if (!invoice) {
            return res.json({ success: false, message: 'Invoice not found' });
        }

        // Create PDF
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
            res.send(pdfData);
        });

        // PDF Content
        doc.fontSize(20).text('Mediflow Hospital', { align: 'center' });
        doc.fontSize(16).text('Invoice', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${invoice.createdAt.toDateString()}`);
        doc.text(`Due Date: ${invoice.dueDate.toDateString()}`);
        doc.moveDown();

        doc.text('Patient Details:');
        doc.text(`Name: ${invoice.patientId.name}`);
        doc.text(`Email: ${invoice.patientId.email}`);
        doc.text(`Phone: ${invoice.patientId.phone}`);
        doc.moveDown();

        // Items table
        doc.text('Items:');
        invoice.items.forEach(item => {
            doc.text(`${item.description} - Quantity: ${item.quantity} - Unit Price: $${item.unitPrice} - Total: $${item.total}`);
        });
        doc.moveDown();

        doc.fontSize(14).text(`Total Amount: $${invoice.totalAmount}`, { align: 'right' });
        doc.text(`Status: ${invoice.status}`, { align: 'right' });

        doc.end();

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to process refund
const processRefund = async (req, res) => {
    try {
        const { appointmentId, refundAmount, reason } = req.body;

        await runInTransaction(async (session) => {
            await refundAppointmentPayment({
                appointmentId,
                refundAmount,
                reason,
                processedBy: process.env.ADMIN_EMAIL,
                session,
            });
        });

        res.json({ success: true, message: 'Refund processed successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const doctor = await doctorModel.findById(doctorId);

        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        const activeAppointments = await appointmentModel.countDocuments({
            docId: doctorId,
            cancelled: false,
            isCompleted: false
        });

        if (activeAppointments > 0) {
            return res.json({
                success: false,
                message: 'Doctor has active appointments and cannot be deleted yet'
            });
        }

        await doctorModel.findByIdAndDelete(doctorId);
        await logAdminAction(process.env.ADMIN_EMAIL, 'DELETE_DOCTOR', 'doctor', doctorId, { name: doctor.name });

        res.json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get payment history for an appointment
const getPaymentHistory = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const response = await getPaginatedPaymentHistory({
            appointmentId,
            query: req.query,
        });
        sendPaginatedResponse(res, response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get billing metrics for analytics
const getPaymentKPIs = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        const invoices = await invoiceModel.find({});

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let pendingPayments = 0;
        let todayRevenue = 0;
        let overdueInvoices = 0;
        let successCount = 0;
        let totalPaidInvoices = 0;

        appointments.forEach(apt => {
            // Pending Payments (Unpaid or Partially Paid)
            const status = apt.paymentStatus || (apt.payment ? 'paid' : 'unpaid');
            if (status === 'unpaid' || status === 'partially paid') {
                pendingPayments += (apt.amount - (apt.partialAmount || 0));
            }

            // Today's Revenue
            const aptDate = new Date(apt.date);
            if (aptDate >= startOfToday && (apt.payment || status === 'paid' || status === 'partially paid')) {
                // This is a simplification; ideally we'd look at paymentLogs for precise daily revenue
                if (status === 'paid') todayRevenue += apt.amount;
                else if (status === 'partially paid') todayRevenue += (apt.partialAmount || 0);
            }

            // Success Rate (Paid / (Paid + Unpaid + Cancelled))
            if (status === 'paid' || status === 'partially paid') {
                successCount++;
            }
        });

        const totalRelevantApts = appointments.filter(a => !a.cancelled).length;
        const paymentSuccessRate = totalRelevantApts > 0 ? (successCount / totalRelevantApts) * 100 : 0;

        // Overdue Invoices
        invoices.forEach(inv => {
            if (inv.status === 'unpaid' && new Date(inv.dueDate) < now) {
                overdueInvoices++;
            }
        });

        res.json({
            success: true,
            kpis: {
                pendingPayments,
                todayRevenue,
                overdueInvoices,
                paymentSuccessRate: Math.round(paymentSuccessRate)
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getBillingMetrics = async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Revenue this month
        const currentMonthAppointments = await appointmentModel.find({
            date: { $gte: startOfMonth, $lte: endOfMonth },
            payment: true
        });
        const totalRevenueThisMonth = currentMonthAppointments.reduce((sum, apt) => sum + apt.amount, 0);

        // Outstanding payments
        const outstandingAppointments = await appointmentModel.find({
            paymentStatus: { $in: ['unpaid', 'partially paid'] },
            cancelled: false
        });
        const outstandingPayments = outstandingAppointments.reduce((sum, apt) => {
            const paid = apt.partialAmount || 0;
            return sum + (apt.amount - paid);
        }, 0);

        // Payment success rate
        const totalAppointments = await appointmentModel.countDocuments({ cancelled: false });
        const paidAppointments = await appointmentModel.countDocuments({
            paymentStatus: 'paid',
            cancelled: false
        });
        const paymentSuccessRate = totalAppointments > 0 ?
            Math.round((paidAppointments / totalAppointments) * 100) : 0;

        // Average transaction value
        const completedPayments = await paymentLogModel.find({ status: 'completed' });
        const averageTransaction = completedPayments.length > 0 ?
            Math.round(completedPayments.reduce((sum, p) => sum + p.amount, 0) / completedPayments.length) : 0;

        // Revenue trends (last 12 months)
        const revenueTrends = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);

            const monthAppointments = await appointmentModel.find({
                date: { $gte: date, $lt: nextMonth },
                payment: true
            });

            const monthRevenue = monthAppointments.reduce((sum, apt) => sum + apt.amount, 0);
            revenueTrends.push({
                month: date.toLocaleString('default', { month: 'short' }),
                revenue: monthRevenue
            });
        }

        // Payment methods distribution
        const paymentMethodsData = await paymentLogModel.aggregate([
            { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } }
        ]);

        const methodsData = { cash: 0, online: 0, card: 0 };
        paymentMethodsData.forEach(method => {
            if (method._id === 'cash') methodsData.cash = method.total;
            else if (method._id === 'online') methodsData.online = method.total;
            else if (method._id === 'card') methodsData.card = method.total;
        });

        // Monthly revenue comparison (current vs last year)
        const monthlyRevenue = [];
        for (let i = 0; i < 12; i++) {
            const currentYearDate = new Date(currentDate.getFullYear(), i, 1);
            const lastYearDate = new Date(currentDate.getFullYear() - 1, i, 1);
            const nextMonth = new Date(currentDate.getFullYear(), i + 1, 1);
            const nextMonthLastYear = new Date(currentDate.getFullYear() - 1, i + 1, 1);

            const currentYearRevenue = await appointmentModel.aggregate([
                { $match: { date: { $gte: currentYearDate, $lt: nextMonth }, payment: true } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const lastYearRevenue = await appointmentModel.aggregate([
                { $match: { date: { $gte: lastYearDate, $lt: nextMonthLastYear }, payment: true } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            monthlyRevenue.push({
                month: currentYearDate.toLocaleString('default', { month: 'short' }),
                currentYear: currentYearRevenue[0]?.total || 0,
                lastYear: lastYearRevenue[0]?.total || 0
            });
        }

        // Invoice metrics
        const totalInvoices = await invoiceModel.countDocuments();
        const paidInvoices = await invoiceModel.countDocuments({ status: 'paid' });
        const overdueInvoicesCount = await invoiceModel.countDocuments({
            status: 'unpaid',
            dueDate: { $lt: new Date() }
        });

        res.json({
            success: true,
            kpis: {
                totalRevenueThisMonth,
                outstandingPayments,
                averageTransaction,
                paymentSuccessRate,
                totalAppointments,
                totalPatients: await userModel.countDocuments({})
            },
            revenueTrends: {
                labels: revenueTrends.map(r => r.month),
                data: revenueTrends.map(r => r.revenue)
            },
            paymentMethods: {
                labels: Object.keys(methodsData),
                data: Object.values(methodsData)
            },
            monthlyRevenue: {
                labels: monthlyRevenue.map(m => m.month),
                currentYear: monthlyRevenue.map(m => m.currentYear),
                lastYear: monthlyRevenue.map(m => m.lastYear)
            },
            additionalMetrics: {
                totalInvoices,
                paidInvoices,
                overdueInvoices: overdueInvoicesCount
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to export financials as CSV
const exportFinancialsCSV = async (req, res) => {
    try {
        const payments = await paymentLogModel.find({}).populate('patientId', 'name email').sort({ timestamp: -1 });

        let csv = 'Date,Patient,Email,Amount,Type,Method,Status,Processed By\n';

        payments.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            const patientName = log.patientId?.name || 'Deleted User';
            const patientEmail = log.patientId?.email || 'N/A';
            csv += `"${date}","${patientName}","${patientEmail}",${log.amount},"${log.type}","${log.method}","${log.status}","${log.processedBy}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=financial_report.csv');
        res.status(200).send(csv);

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get high-end advanced analytics
const getAdvancedAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, granularity = 'daily' } = req.query;

        const query = {};
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate).getTime(), $lte: new Date(endDate).getTime() };
        }

        const appointments = await appointmentModel.find(query).populate('docId', 'name speciality image');
        const users = await userModel.find({});
        const paymentLogs = await paymentLogModel.find(query);
        const invoices = await invoiceModel.find({});

        // 1. Operational Overview
        const operational = {
            totalAppointments: appointments.length,
            completed: appointments.filter(a => deriveVisitStatusFromLegacyFlags(a) === VISIT_STATUS.COMPLETED).length,
            cancelled: appointments.filter(a => deriveVisitStatusFromLegacyFlags(a) === VISIT_STATUS.CANCELLED).length,
            pending: appointments.filter(a => deriveVisitStatusFromLegacyFlags(a) === VISIT_STATUS.REQUESTED).length,
            accepted: appointments.filter(a => deriveVisitStatusFromLegacyFlags(a) === VISIT_STATUS.ACCEPTED).length,
            checkedIn: appointments.filter(a => deriveVisitStatusFromLegacyFlags(a) === VISIT_STATUS.CHECKED_IN).length,
            inConsultation: appointments.filter(a => deriveVisitStatusFromLegacyFlags(a) === VISIT_STATUS.IN_CONSULTATION).length,
        };

        // 2. Financial Overview
        let totalRevenue = 0;
        const revenueByMethod = { cash: 0, online: 0, card: 0 };
        paymentLogs.forEach(log => {
            if (log.status === 'completed' && log.type !== 'refund') {
                totalRevenue += log.amount;
                revenueByMethod[log.method] = (revenueByMethod[log.method] || 0) + log.amount;
            } else if (log.type === 'refund') {
                totalRevenue -= log.amount;
            }
        });

        const financial = {
            totalRevenue,
            revenueByMethod,
            outstandingPayments: appointments.reduce((sum, a) => sum + (a.amount - (a.partialAmount || 0)), 0),
            averageTransaction: paymentLogs.length > 0 ? Math.round(totalRevenue / paymentLogs.length) : 0
        };

        // 3. Performance Trends (Granular)
        const trendsMap = {};
        appointments.forEach(a => {
            const date = new Date(a.date);
            let key;
            if (granularity === 'daily') key = date.toISOString().split('T')[0];
            else if (granularity === 'weekly') {
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay());
                key = startOfWeek.toISOString().split('T')[0];
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!trendsMap[key]) trendsMap[key] = { date: key, revenue: 0, appointments: 0 };
            trendsMap[key].appointments += 1;
            if (a.payment || a.paymentStatus === 'paid') {
                trendsMap[key].revenue += a.amount;
            }
        });

        const performanceTrends = Object.values(trendsMap).sort((a, b) => a.date.localeCompare(b.date));

        // 4. Doctor Performance
        const docPerf = {};
        appointments.forEach(a => {
            const docId = a.docId?._id?.toString();
            if (!docId) return;
            if (!docPerf[docId]) {
                docPerf[docId] = {
                    doctor: a.docId,
                    revenue: 0,
                    appointments: 0,
                    rating: 4.5 // Placeholder for future enhancement
                };
            }
            docPerf[docId].appointments += 1;
            if (a.payment || a.paymentStatus === 'paid') docPerf[docId].revenue += a.amount;
        });

        const topDoctors = Object.values(docPerf).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        res.json({
            success: true,
            operational,
            financial,
            performanceTrends,
            topDoctors,
            patientGrowth: {
                total: users.length,
                newThisMonth: users.filter(u => new Date(u.date).getMonth() === new Date().getMonth()).length
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get audit logs
const getAuditLogs = async (req, res) => {
    try {
        const response = await getPaginatedAuditLogs(req.query);
        sendPaginatedResponse(res, response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}




// API to add staff
const addStaff = async (req, res) => {
    try {
        const { name, email, password, dob, phone } = req.body;
        const imageFile = req.file;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        const existingStaff = await staffModel.findOne({ email });
        if (existingStaff) {
            return res.json({ success: false, message: "Staff with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let imageUrl = "https://via.placeholder.com/150"; // Default
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

        const staffData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            dob,
            phone,
            role: 'Staff',
            date: Date.now()
        };

        const staff = new staffModel(staffData);
        await staff.save();

        res.json({ success: true, message: "Staff added successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all staff
const allStaff = async (req, res) => {
    try {
        const response = await getPaginatedStaffForAdmin(req.query);
        sendPaginatedResponse(res, response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export {
    loginAdmin, getAdminSession, refreshSession, logoutAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard,
    appointmentAccept, getSettings, updateSettings, getPatientDetails, getAnalytics, getAllPatients,
    updatePaymentStatus, updatePaymentMethods, updateDoctor, createPatientAdmin,
    generateInvoice, getAllInvoices, updateInvoiceStatus, downloadInvoicePDF,
    processRefund, getPaymentHistory, getPaymentKPIs,
    getBillingMetrics, getAdvancedAnalytics, exportFinancialsCSV, getAuditLogs,
    addStaff, allStaff, deleteDoctor
}
