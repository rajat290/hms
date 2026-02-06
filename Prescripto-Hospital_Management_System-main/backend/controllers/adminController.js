import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import settingsModel from "../models/settingsModel.js";
import userModel from "../models/userModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import paymentLogModel from "../models/paymentLogModel.js";
import invoiceModel from "../models/invoiceModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import auditLogModel from "../models/auditLogModel.js";

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
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

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
        await appointmentModel.findByIdAndUpdate(appointmentId, { isAccepted: true })
        res.json({ success: true, message: 'Appointment Accepted' })
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
            settings = await settingsModel.create({ cancellationWindow: 2 })
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

        if (!cancellationWindow || cancellationWindow < 1 || cancellationWindow > 7) {
            return res.json({ success: false, message: 'Cancellation window must be between 1 and 7 days' });
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
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, patient: user });
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
            Accepted: 0
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
            if (apt.cancelled) {
                statusCounts.Cancelled += 1;
            } else if (apt.isCompleted) {
                statusCounts.Completed += 1;
            } else if (apt.isAccepted) {
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
        const doctors = await doctorModel.find({}).select('-password');
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get admin dashboard data
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});
        const users = await userModel.find({});
        const appointments = await appointmentModel.find({});

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all patients
const getAllPatients = async (req, res) => {
    try {
        const patients = await userModel.find({}).select('-password');
        res.json({ success: true, patients });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update payment status (Admin)
const updatePaymentStatus = async (req, res) => {
    try {
        const { appointmentId, paymentStatus, partialAmount, paymentMethod = 'cash', notes = '' } = req.body;

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        const updateData = { paymentStatus };
        let logAmount = 0;

        if (paymentStatus === 'partially paid') {
            if (!partialAmount || partialAmount <= 0) {
                return res.json({ success: false, message: 'Valid partial amount required' });
            }
            if (partialAmount >= appointment.amount) {
                return res.json({ success: false, message: 'Partial amount must be less than total amount' });
            }

            updateData.partialAmount = (appointment.partialAmount || 0) + partialAmount;
            updateData.payment = false; // Not fully paid
            logAmount = partialAmount;
        } else if (paymentStatus === 'paid') {
            updateData.payment = true; // Fully paid
            updateData.partialAmount = appointment.amount; // Set to full amount
            logAmount = appointment.amount - (appointment.partialAmount || 0); // Log only the new payment
        } else {
            updateData.payment = false;
            updateData.partialAmount = 0;
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, updateData);

        // Log the payment transaction
        if (logAmount > 0 || paymentStatus === 'paid') {
            await paymentLogModel.create({
                appointmentId,
                patientId: appointment.userId,
                amount: logAmount,
                type: paymentStatus === 'paid' ? 'payment' : 'partial_payment',
                method: paymentMethod,
                status: 'completed',
                notes,
                processedBy: process.env.ADMIN_EMAIL
            });
        }

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
        const {
            name, email, phone, dob, gender, medicalRecordNumber, aadharNumber,
            insuranceProvider, insuranceId, address, emergencyContact
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !dob || !gender || !medicalRecordNumber || !aadharNumber || !address) {
            return res.json({ success: false, message: 'All required fields must be provided' });
        }

        // Validate email
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' });
        }

        // Check if patient already exists
        const existingPatient = await userModel.findOne({
            $or: [{ email }, { phone }, { medicalRecordNumber }, { aadharNumber }]
        });

        if (existingPatient) {
            return res.json({ success: false, message: 'Patient with this email, phone, MRN, or Aadhaar already exists' });
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Handle image uploads
        let profileImageUrl = '';
        let aadharImageUrl = '';

        if (req.files?.image?.[0]) {
            const profileUpload = await cloudinary.uploader.upload(req.files.image[0].path, { resource_type: "image" });
            profileImageUrl = profileUpload.secure_url;
        }

        if (req.files?.aadharImage?.[0]) {
            const aadharUpload = await cloudinary.uploader.upload(req.files.aadharImage[0].path, { resource_type: "image" });
            aadharImageUrl = aadharUpload.secure_url;
        }

        // Create patient data
        const patientData = {
            name,
            email,
            phone,
            dob,
            gender,
            medicalRecordNumber,
            aadharNumber,
            insuranceProvider,
            insuranceId,
            address: typeof address === 'string' ? JSON.parse(address) : address,
            emergencyContact: typeof emergencyContact === 'string' ? JSON.parse(emergencyContact) : emergencyContact,
            image: profileImageUrl,
            aadharImage: aadharImageUrl,
            password: hashedPassword,
            date: Date.now()
        };

        const patient = new userModel(patientData);
        await patient.save();

        // Send welcome email with credentials
        const transporter = nodemailer.createTransporter({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Prescripto - Your Account Details',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to Prescripto!</h2>
                    <p>Your account has been created successfully.</p>
                    <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                        <h3>Your Login Credentials:</h3>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                        <p style="color: #d32f2f;"><strong>Please change your password after first login.</strong></p>
                    </div>
                    <p>You can now book appointments and manage your healthcare needs through our platform.</p>
                    <p>Best regards,<br>Prescripto Team</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Email sending failed:', error);
            } else {
                console.log('Welcome email sent:', info.response);
            }
        });

        res.json({
            success: true,
            message: 'Patient created successfully',
            patient: {
                _id: patient._id,
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                medicalRecordNumber: patient.medicalRecordNumber,
                aadharNumber: patient.aadharNumber
            },
            credentials: {
                email,
                password: tempPassword
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

        const appointment = await appointmentModel.findById(appointmentId)
            .populate('userId', 'name email phone')
            .populate('docId', 'name speciality fees');

        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Generate invoice number
        const currentYear = new Date().getFullYear();
        const invoiceCount = await invoiceModel.countDocuments({ createdAt: { $gte: new Date(currentYear, 0, 1) } });
        const invoiceNumber = `INV-${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`;

        const invoiceData = {
            invoiceNumber,
            patientId: appointment.userId._id,
            appointmentId: appointment._id,
            items: [{
                description: `Consultation with Dr. ${appointment.docData.name} (${appointment.docData.speciality})`,
                quantity: 1,
                unitPrice: appointment.amount,
                total: appointment.amount
            }],
            totalAmount: appointment.amount,
            status: appointment.payment ? 'paid' : 'unpaid',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            createdAt: new Date()
        };

        const invoice = new invoiceModel(invoiceData);
        await invoice.save();

        res.json({ success: true, message: 'Invoice generated successfully', invoice });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all invoices
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await invoiceModel.find({})
            .populate('patientId', 'name email phone')
            .populate('appointmentId', 'slotDate slotTime')
            .sort({ createdAt: -1 });

        res.json({ success: true, invoices });
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
        doc.fontSize(20).text('Prescripto Hospital', { align: 'center' });
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

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        if (!appointment.payment) {
            return res.json({ success: false, message: 'Cannot refund unpaid appointment' });
        }

        if (refundAmount > appointment.amount) {
            return res.json({ success: false, message: 'Refund amount cannot exceed appointment amount' });
        }

        // Update appointment status
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            paymentStatus: 'refunded',
            payment: false
        });

        // Log refund
        await paymentLogModel.create({
            appointmentId,
            patientId: appointment.userId,
            amount: refundAmount,
            type: 'refund',
            method: 'online', // Assuming refunds go back to original payment method
            status: 'completed',
            notes: reason,
            processedBy: process.env.ADMIN_EMAIL
        });

        res.json({ success: true, message: 'Refund processed successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get payment history for an appointment
const getPaymentHistory = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const paymentLogs = await paymentLogModel.find({ appointmentId })
            .sort({ timestamp: -1 });

        res.json({ success: true, paymentHistory: paymentLogs });
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

// API to get audit logs
const getAuditLogs = async (req, res) => {
    try {
        const logs = await auditLogModel.find({}).sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, logs });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    appointmentAccept,
    getSettings,
    updateSettings,
    getPatientDetails,
    getAnalytics,
    addDoctor,
    allDoctors,
    adminDashboard,
    getAllPatients,
    updatePaymentStatus,
    updatePaymentMethods,
    updateDoctor,
    createPatientAdmin,
    generateInvoice,
    getAllInvoices,
    updateInvoiceStatus,
    downloadInvoicePDF,
    processRefund,
    getPaymentHistory,
    getPaymentKPIs,
    getBillingMetrics,
    exportFinancialsCSV,
    getAuditLogs
}
