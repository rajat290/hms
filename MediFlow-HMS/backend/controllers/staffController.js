import staffModel from "../models/staffModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import { cancelAppointmentRecord, ensureInvoiceForAppointmentId, normalizeAppointmentPaymentMethod } from "../utils/appointmentIntegrity.js";
import { transitionAppointmentVisitStatus, VISIT_STATUS } from "../utils/appointmentLifecycle.js";
import { parsePaginationQuery, sendPaginatedResponse } from "../utils/pagination.js";
import { runInTransaction } from "../utils/transaction.js";
import {
    sanitizeAppointmentForClient,
    sanitizeStaffForClient,
    sanitizeUserForClient,
} from "../utils/clientSanitizers.js";
import {
    clearBackofficeSessionCookies,
    clearSessionCookies,
    getRefreshTokenFromRequest,
    setSessionCookies,
} from "../utils/sessionCookies.js";
import { createRoleAuthRepository } from "../repositories/roleAuthRepository.js";
import { loginRoleAccount, logoutRoleSession, refreshRoleSession, requestRolePasswordReset, resetRolePassword, verifyRoleEmail } from "../services/auth/roleAccountService.js";
import { createPatientOnboarding } from "../services/patients/patientOnboardingService.js";

const staffAccountRepository = createRoleAuthRepository(staffModel);

// API to verify email for staff
const verifyEmail = async (req, res) => {
    try {
        const response = await verifyRoleEmail({
            token: req.body.token,
            repository: staffAccountRepository,
            successMessage: 'Staff email verified successfully',
        });
        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API for staff login
const loginStaff = async (req, res) => {
    try {
        const { email, password } = req.body;
        const response = await loginRoleAccount({
            email,
            password,
            origin: req.headers.origin,
            req,
            role: 'staff',
            repository: staffAccountRepository,
            verificationEmail: {
                role: 'staff',
                subject: 'Verify Your Staff Account - Mediflow',
                heading: 'Email Verification Required',
                body: 'Please click the button below to verify your staff account.',
            },
        });

        if (response.success && response.token && response.refreshToken) {
            clearBackofficeSessionCookies(res);
            setSessionCookies(res, 'staff', response);
        }

        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get staff profile data
const getProfile = async (req, res) => {
    try {
        const { staffId } = req.body;
        const staff = await staffModel.findById(staffId);
        res.json({ success: true, staff: sanitizeStaffForClient(staff) });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to update staff profile
const updateProfile = async (req, res) => {
    try {
        const { staffId, name, phone, dob } = req.body;

        await staffModel.findByIdAndUpdate(staffId, { name, phone, dob });
        res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all appointments for Staff
const getAllAppointments = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 50 });
        const query = {};

        const [totalItems, appointments] = await Promise.all([
            appointmentModel.countDocuments(query),
            appointmentModel.find(query)
                .populate('docId', 'name speciality image')
                .populate('userId', 'name dob gender image')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        sendPaginatedResponse(res, {
            message: 'Staff appointments fetched successfully',
            itemKey: 'appointments',
            items: appointments.map((appointment) => sanitizeAppointmentForClient(appointment)),
            page,
            limit,
            totalItems,
        });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body

        await runInTransaction(async (session) => {
            await cancelAppointmentRecord({ appointmentId, session, reason: 'Cancelled by staff' })
        })

        res.json({ success: true, message: 'Appointment Cancelled' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all patients
const getAllPatients = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 50 });
        const query = {};

        const [totalItems, patients] = await Promise.all([
            userModel.countDocuments(query),
            userModel.find(query)
                .sort({ _id: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        sendPaginatedResponse(res, {
            message: 'Patients fetched successfully',
            itemKey: 'patients',
            items: patients.map((patient) => sanitizeUserForClient(patient, { viewer: 'staff' })),
            page,
            limit,
            totalItems,
        });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to create patient (Staff)
const createPatient = async (req, res) => {
    try {
        const { credentials } = await createPatientOnboarding({
            input: req.body,
            files: req.files,
            options: {
                requiredFields: ['name', 'email', 'phone', 'dob', 'gender'],
                missingFieldsMessage: 'Name, Email, Phone, DOB and Gender are required',
                duplicateMessage: 'Patient with this details already exists',
            },
        });

        res.json({
            success: true,
            message: 'Patient created successfully',
            credentials,
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API for Staff Dashboard data
const staffDashboard = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})
        const patients = await userModel.find({})
        const doctors = await doctorModel.find({})

        const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '_')
        const todayAppointments = await appointmentModel.find({ slotDate: today, payment: true })
        const totalCollections = todayAppointments.reduce((acc, curr) => acc + (curr.amount || 0), 0)

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: patients.length,
            totalCollections,
            latestAppointments: appointments.reverse().slice(0, 5).map((appointment) => sanitizeAppointmentForClient(appointment))
        }

        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get appointments for specific date range (or today)
const getDailyAppointments = async (req, res) => {
    try {
        const { date } = req.query; // Expects dd_mm_yyyy format
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 50 });

        // If date is provided, filter by it. Otherwise return all (or logic could specific to today)
        // For now, let's keep it flexible. If date matches slotDate

        let query = {};
        if (date) {
            query.slotDate = date;
        }

        const [totalItems, appointments] = await Promise.all([
            appointmentModel.countDocuments(query),
            appointmentModel.find(query)
                .populate('docId', 'name speciality image')
                .populate('userId', 'name dob gender image')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        sendPaginatedResponse(res, {
            message: 'Daily appointments fetched successfully',
            itemKey: 'appointments',
            items: appointments.map((appointment) => sanitizeAppointmentForClient(appointment)),
            page,
            limit,
            totalItems,
        });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark check-in
const markCheckIn = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        await runInTransaction(async (session) => {
            const appointment = await appointmentModel.findById(appointmentId).session(session);

            if (!appointment) {
                throw new Error('Appointment not found');
            }

            transitionAppointmentVisitStatus({
                appointment,
                nextStatus: VISIT_STATUS.CHECKED_IN,
                allowedFrom: [VISIT_STATUS.REQUESTED, VISIT_STATUS.ACCEPTED],
            });

            await appointment.save({ session });

            await notificationModel.create([{
                recipientType: 'staff',
                title: "Patient Checked In",
                message: `Patient ${appointment.userData?.name || 'Unknown patient'} has checked in for their appointment.`,
                type: "appointment"
            }], { session, ordered: true });
        })

        res.json({ success: true, message: 'Patient Checked In' });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update payment details (full update)
const updatePayment = async (req, res) => {
    try {
        const { appointmentId, paymentStatus, paymentMethod, partialAmount, billingItems } = req.body;

        await runInTransaction(async (session) => {
            const appointment = await appointmentModel.findById(appointmentId).populate('userId', 'name').session(session);

            if (!appointment) {
                throw new Error('Appointment not found');
            }

            appointment.paymentStatus = paymentStatus;

            if (paymentMethod) {
                appointment.paymentMethod = normalizeAppointmentPaymentMethod(paymentMethod);
            }

            if (partialAmount !== undefined) {
                appointment.amount = Number(partialAmount);
                appointment.partialAmount = Number(partialAmount);
            }

            if (billingItems) {
                appointment.billingItems = billingItems;
            }

            appointment.invoiceDate = new Date();

            if (paymentStatus === 'paid') {
                appointment.payment = true;
            } else if (paymentStatus === 'unpaid') {
                appointment.payment = false;
                appointment.partialAmount = 0;
            } else {
                appointment.payment = false;
            }

            await appointment.save({ session });
            await ensureInvoiceForAppointmentId(appointmentId, session);

            await notificationModel.create([{
                recipientType: 'staff',
                title: "Payment Received",
                message: `Payment of ${partialAmount || appointment.amount} received from ${appointment.userId.name} via ${paymentMethod || 'standard method'}.`,
                type: "payment"
            }], { session, ordered: true })
        })

        res.json({ success: true, message: 'Payment Updated' });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

import notificationModel from "../models/notificationModel.js";

// API to get notifications for staff
const getStaffNotifications = async (req, res) => {
    try {
        const { staffId } = req.body;
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 20 });
        const query = {
            $or: [
                { staffId },
                { recipientType: 'staff' },
                { recipientType: 'all' }
            ]
        };

        const [totalItems, notifications] = await Promise.all([
            notificationModel.countDocuments(query),
            notificationModel.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        sendPaginatedResponse(res, {
            message: 'Notifications fetched successfully',
            itemKey: 'notifications',
            items: notifications,
            page,
            limit,
            totalItems,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to mark notification as read
const markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.body;
        await notificationModel.findByIdAndUpdate(notificationId, { read: true });
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to forgot password for staff
const forgotPassword = async (req, res) => {
    try {
        const response = await requestRolePasswordReset({
            email: req.body.email,
            origin: req.headers.origin,
            repository: staffAccountRepository,
            emailConfig: {
                role: 'staff',
                subject: 'Password Reset - Mediflow Staff Panel',
                accountLabel: 'Staff account',
            },
            notFoundMessage: 'Staff member not found',
        });
        res.json({
            ...response,
            message: response.success ? 'Reset link sent' : response.message,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to reset password for staff
const resetPassword = async (req, res) => {
    try {
        const response = await resetRolePassword({
            token: req.body.token,
            newPassword: req.body.newPassword,
            req,
            role: 'staff',
            repository: staffAccountRepository,
        });

        if (response.success && response.token && response.refreshToken) {
            setSessionCookies(res, 'staff', response);
        }

        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const refreshSession = async (req, res) => {
    try {
        const response = await refreshRoleSession({
            refreshToken: getRefreshTokenFromRequest(req, 'staff'),
            role: 'staff',
            req,
        });
        setSessionCookies(res, 'staff', response);
        res.json(response);
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: error.message || 'Session refresh failed' });
    }
}

const logoutStaff = async (req, res) => {
    try {
        const response = await logoutRoleSession({
            sessionId: req.auth?.sessionId,
            reason: 'Staff logout',
        });
        clearSessionCookies(res, 'staff');
        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { loginStaff, getProfile, updateProfile, getAllAppointments, cancelAppointment, getAllPatients, createPatient, staffDashboard, getDailyAppointments, markCheckIn, updatePayment, getStaffNotifications, markNotificationRead, forgotPassword, resetPassword, refreshSession, logoutStaff, verifyEmail }
