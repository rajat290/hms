import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import settingsModel from "../models/settingsModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import privacyRequestModel from "../models/privacyRequestModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';
import crypto from 'crypto';
import { generateAvailableSlots } from "../utils/slotGenerator.js";
import notificationModel from "../models/notificationModel.js";
import { cancelAppointmentRecord, finalizeAppointmentPayment, isAppointmentSlotConflict, releaseDoctorSlot, reserveDoctorSlot } from "../utils/appointmentIntegrity.js";
import { deriveVisitStatusFromLegacyFlags, resetAppointmentForReschedule, VISIT_STATUS } from "../utils/appointmentLifecycle.js";
import { parsePaginationQuery, sendPaginatedResponse } from "../utils/pagination.js";
import { revokeSessionById, rotateRefreshSession } from "../utils/authSessions.js";
import {
    buildAppointmentDoctorSnapshot,
    buildAppointmentUserSnapshot,
    sanitizeAppointmentForClient,
    sanitizeUserForClient,
} from "../utils/clientSanitizers.js";
import {
    clearSessionCookies,
    getRefreshTokenFromRequest,
    setSessionCookies,
} from "../utils/sessionCookies.js";
import {
    buildPrivacyConsentRecord,
    buildPrivacyExportPayload,
    getDeletionReviewWindowDays,
    getPrivacyPolicyVersion,
    isPrivacyConsentCurrent,
} from "../utils/privacy.js";
import { runInTransaction } from "../utils/transaction.js";
import {
    enableUserTwoFactor,
    loginUserAccount,
    registerUserAccount,
    requestUserPasswordReset,
    resetUserPassword,
    verifyUserEmail,
    verifyUserTwoFactor,
} from "../services/auth/userAuthService.js";

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const getOrCreateSettings = async () => {
    let settings = await settingsModel.findOne({})

    if (!settings) {
        settings = await settingsModel.create({})
    }

    return settings
}

const serializePrivacyRequest = (request) => {
    if (!request) {
        return request
    }

    if (typeof request.toObject === 'function') {
        return request.toObject({ virtuals: false })
    }

    return JSON.parse(JSON.stringify(request))
}

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;
        const response = await registerUserAccount({
            name,
            email,
            password,
            origin: req.headers.origin,
        });

        res.json(response)

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const response = await loginUserAccount({
            email,
            password,
            origin: req.headers.origin,
            req,
        });

        if (response.success && response.token && response.refreshToken) {
            setSessionCookies(res, 'user', response);
        }

        res.json(response)
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('+aadharNumber')

        res.json({ success: true, userData: sanitizeUserForClient(userData, { viewer: 'self' }) })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        // Update user profile with extended fields
        const updateData = { name, dob, gender }

        if (phone) updateData.phone = phone
        if (address) updateData.address = typeof address === 'string' ? JSON.parse(address) : address

        // Extended fields
        const { bloodGroup, knownAllergies, currentMedications, emergencyContact, insuranceProvider, insuranceId } = req.body
        if (bloodGroup) updateData.bloodGroup = bloodGroup
        if (knownAllergies) updateData.knownAllergies = knownAllergies
        if (currentMedications) updateData.currentMedications = currentMedications
        if (emergencyContact) updateData.emergencyContact = typeof emergencyContact === 'string' ? JSON.parse(emergencyContact) : emergencyContact
        if (insuranceProvider) updateData.insuranceProvider = insuranceProvider
        if (insuranceId) updateData.insuranceId = insuranceId
        if (req.body.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = req.body.twoFactorEnabled === 'true' || req.body.twoFactorEnabled === true

        await userModel.findByIdAndUpdate(userId, updateData)

        if (imageFile) {
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url
            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime, patientInfo, paymentMethod } = req.body

        const newAppointment = await runInTransaction(async (session) => {
            const docData = await doctorModel.findById(docId).select("-password").session(session)

            if (!docData) {
                throw new Error('Doctor not found')
            }

            if (!docData.available) {
                throw new Error('Doctor Not Available')
            }

            if (paymentMethod === 'Online' && (!docData.paymentMethods || !docData.paymentMethods.online)) {
                throw new Error('Online payment not available for this doctor')
            }

            const existingAppointment = await appointmentModel.findOne({
                docId,
                slotDate,
                slotTime,
                cancelled: false,
            }).session(session)

            if (existingAppointment) {
                throw new Error('Slot Not Available')
            }

            const userData = await userModel.findById(userId).select("-password").session(session)

            if (!userData) {
                throw new Error('User not found')
            }

            const appointmentData = {
                userId,
                docId,
                userData: buildAppointmentUserSnapshot(userData),
                docData: buildAppointmentDoctorSnapshot(docData),
                amount: docData.fees,
                slotTime,
                slotDate,
                date: Date.now(),
                visitStatus: VISIT_STATUS.REQUESTED,
                lastStatusUpdatedAt: new Date(),
                paymentMethod: paymentMethod || 'Cash',
                patientInfo: patientInfo || null
            }

            const [createdAppointment] = await appointmentModel.create([appointmentData], { session, ordered: true })

            await reserveDoctorSlot({ docId, slotDate, slotTime, session })

            await notificationModel.create([
                {
                    userId,
                    title: "Appointment Booked",
                    message: `Your appointment with Dr. ${docData.name} has been booked for ${slotDate} at ${slotTime}.`,
                    type: "appointment"
                },
                {
                    recipientType: 'staff',
                    title: "New Appointment Booked",
                    message: `New appointment booked by ${userData.name} with Dr. ${docData.name} on ${slotDate} at ${slotTime}`,
                    type: "appointment"
                }
            ], { session, ordered: true })

            return createdAppointment
        })

        res.json({ success: true, message: 'Appointment Booked', appointmentId: newAppointment._id })

    } catch (error) {
        if (isAppointmentSlotConflict(error)) {
            return res.json({ success: false, message: 'Slot Not Available' })
        }

        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body

        await runInTransaction(async (session) => {
            const appointmentData = await appointmentModel.findById(appointmentId).session(session)
            if (!appointmentData) {
                throw new Error('Appointment not found')
            }

            if (appointmentData.userId.toString() !== userId) {
                throw new Error('Unauthorized action')
            }

            const visitStatus = deriveVisitStatusFromLegacyFlags(appointmentData)

            if ([
                VISIT_STATUS.CHECKED_IN,
                VISIT_STATUS.IN_CONSULTATION,
                VISIT_STATUS.COMPLETED,
                VISIT_STATUS.CANCELLED,
            ].includes(visitStatus)) {
                throw new Error('This appointment can no longer be cancelled from the patient panel.')
            }

            const settings = await settingsModel.findOne({}).session(session)
            const cancelWindow = settings ? settings.cancellationWindow : 24

            const { slotDate, slotTime } = appointmentData
            const dateParts = slotDate.split('_')
            let day = parseInt(dateParts[0])
            let month = parseInt(dateParts[1]) - 1
            let year = parseInt(dateParts[2])

            let appointmentDateTime = new Date(year, month, day)
            let timeParts = slotTime.split(':')
            let hours = parseInt(timeParts[0])
            let minutes = parseInt(timeParts[1])

            if (slotTime.toLowerCase().includes('pm') && hours !== 12) {
                hours += 12
            }
            if (slotTime.toLowerCase().includes('am') && hours === 12) {
                hours = 0
            }

            appointmentDateTime.setHours(hours, minutes, 0, 0)

            const now = new Date()
            const diffMs = appointmentDateTime - now
            const diffHours = diffMs / (1000 * 60 * 60)

            if (diffHours < cancelWindow) {
                throw new Error(`Cancellation restricted within ${cancelWindow} hours of appointment.`)
            }

            await cancelAppointmentRecord({
                appointmentId,
                session,
                reason: 'Cancelled by patient',
            })
        })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 20 })
        const query = { userId }

        const [totalItems, appointments] = await Promise.all([
            appointmentModel.countDocuments(query),
            appointmentModel.find(query).sort({ date: -1 }).skip(skip).limit(limit),
        ])

        sendPaginatedResponse(res, {
            message: 'Appointments fetched successfully',
            itemKey: 'appointments',
            items: appointments.map((appointment) => sanitizeAppointmentForClient(appointment)),
            page,
            limit,
            totalItems,
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get financial summary for user
const getFinancialSummary = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId });
        let totalPaid = 0;
        let pendingDues = 0;
        appointments.forEach(app => {
            if (app.paymentStatus === 'paid') {
                totalPaid += app.amount;
            } else if (app.paymentStatus === 'partially paid') {
                totalPaid += app.partialAmount;
                pendingDues += app.amount - app.partialAmount;
            } else {
                pendingDues += app.amount;
            }
        });
        res.json({ success: true, totalPaid, pendingDues });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to generate prescription - Removed (Doctor only feature)


// API to get prescriptions for user
const getUserPrescriptions = async (req, res) => {
    try {
        const { userId } = req.body;
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 20 });
        const query = { userId };

        const [totalItems, prescriptions] = await Promise.all([
            prescriptionModel.countDocuments(query),
            prescriptionModel.find(query).sort({ date: -1 }).skip(skip).limit(limit),
        ]);

        sendPaginatedResponse(res, {
            message: 'Prescriptions fetched successfully',
            itemKey: 'prescriptions',
            items: prescriptions,
            page,
            limit,
            totalItems,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        if (appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized payment request' })
        }

        if (appointmentData.paymentStatus === 'paid') {
            return res.json({ success: false, message: 'Appointment is already paid' })
        }

        const payableAmount = appointmentData.amount - (appointmentData.partialAmount || 0)

        if (payableAmount <= 0) {
            return res.json({ success: false, message: 'No payment is due for this appointment' })
        }

        // creating options for razorpay payment
        const options = {
            amount: payableAmount * 100,
            currency: 'INR',
            receipt: appointmentId,
            notes: {
                appointmentId: appointmentId
            }
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.json({ success: false, message: 'Missing payment verification details' })
        }

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        if (generatedSignature !== razorpay_signature) {
            return res.json({ success: false, message: 'Payment signature verification failed' })
        }

        const appointmentData = await appointmentModel.findById(orderInfo.receipt)

        if (!appointmentData || appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized payment verification request' })
        }

        if (orderInfo.status === 'paid') {
            await runInTransaction(async (session) => {
                await finalizeAppointmentPayment({
                    appointmentId: orderInfo.receipt,
                    transactionId: razorpay_payment_id,
                    paymentMethod: 'Online',
                    notes: 'Verified via Razorpay callback',
                    processedBy: 'razorpay-verification',
                    session,
                })
            })

            return res.json({ success: true, message: "Payment Successful" })
        }

        res.json({ success: false, message: 'Payment Failed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        if (appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized payment request' })
        }

        if (appointmentData.paymentStatus === 'paid') {
            return res.json({ success: false, message: 'Appointment is already paid' })
        }

        const payableAmount = appointmentData.amount - (appointmentData.partialAmount || 0)

        if (payableAmount <= 0) {
            return res.json({ success: false, message: 'No payment is due for this appointment' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: payableAmount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
            client_reference_id: appointmentData._id.toString(),
            metadata: {
                appointmentId: appointmentData._id.toString()
            }
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { userId, appointmentId, sessionId } = req.body

        if (!sessionId) {
            return res.json({ success: false, message: 'Missing Stripe session details' })
        }

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized payment verification request' })
        }

        const session = await stripeInstance.checkout.sessions.retrieve(sessionId)

        if (session.client_reference_id !== appointmentId) {
            return res.json({ success: false, message: 'Stripe session does not match appointment' })
        }

        if (session.payment_status === 'paid') {
            await runInTransaction(async (dbSession) => {
                await finalizeAppointmentPayment({
                    appointmentId,
                    transactionId: session.payment_intent || session.id,
                    paymentMethod: 'Online',
                    notes: 'Verified via Stripe checkout session',
                    processedBy: 'stripe-verification',
                    session: dbSession,
                })
            })

            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to verify email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const response = await verifyUserEmail({ token });
        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const response = await requestUserPasswordReset({
            email,
            origin: req.headers.origin,
        });
        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to reset password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const response = await resetUserPassword({
            token,
            newPassword,
            req,
        });

        if (response.success && response.token && response.refreshToken) {
            setSessionCookies(res, 'user', response);
        }

        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to enable 2FA
const enable2FA = async (req, res) => {
    try {
        const { userId } = req.body;
        const response = await enableUserTwoFactor({ userId });
        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to verify 2FA
const verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;
        const response = await verifyUserTwoFactor({
            userId,
            code,
            req,
        });

        if (response.success && response.token && response.refreshToken) {
            setSessionCookies(res, 'user', response);
        }

        res.json(response);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const refreshSession = async (req, res) => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req, 'user');
        const session = await rotateRefreshSession(refreshToken, 'user', req);
        setSessionCookies(res, 'user', session);

        res.json({ success: true, ...session });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: error.message || 'Session refresh failed' });
    }
}

const logoutUser = async (req, res) => {
    try {
        await revokeSessionById(req.auth?.sessionId, 'User logout');
        clearSessionCookies(res, 'user');
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to reschedule appointment
const rescheduleAppointment = async (req, res) => {
    try {
        const { userId, appointmentId, newSlotDate, newSlotTime } = req.body;

        await runInTransaction(async (session) => {
            const appointment = await appointmentModel.findById(appointmentId).session(session);
            if (!appointment || appointment.userId.toString() !== userId) {
                throw new Error('Appointment not found');
            }

            const visitStatus = deriveVisitStatusFromLegacyFlags(appointment);

            if ([
                VISIT_STATUS.CHECKED_IN,
                VISIT_STATUS.IN_CONSULTATION,
                VISIT_STATUS.COMPLETED,
                VISIT_STATUS.CANCELLED,
            ].includes(visitStatus)) {
                throw new Error('Only requested or accepted appointments can be rescheduled');
            }

            const conflictingAppointment = await appointmentModel.findOne({
                _id: { $ne: appointmentId },
                docId: appointment.docId,
                slotDate: newSlotDate,
                slotTime: newSlotTime,
                cancelled: false,
            }).session(session);

            if (conflictingAppointment) {
                throw new Error('New slot requested is not available');
            }

            const doctorData = await doctorModel.findById(appointment.docId).session(session);
            if (!doctorData) {
                throw new Error('Doctor not found');
            }

            const previousSlotDate = appointment.slotDate;
            const previousSlotTime = appointment.slotTime;

            appointment.slotDate = newSlotDate;
            appointment.slotTime = newSlotTime;
            appointment.reminderSent24h = false;
            appointment.reminderSent2h = false;
            appointment.reminderSent24hAt = undefined;
            appointment.reminderSent2hAt = undefined;
            appointment.reminder24hLockUntil = undefined;
            appointment.reminder2hLockUntil = undefined;
            resetAppointmentForReschedule({ appointment, at: new Date() });
            await appointment.save({ session });

            await releaseDoctorSlot({
                docId: appointment.docId,
                slotDate: previousSlotDate,
                slotTime: previousSlotTime,
                session,
            });

            await reserveDoctorSlot({
                docId: appointment.docId,
                slotDate: newSlotDate,
                slotTime: newSlotTime,
                session,
            });

            await notificationModel.create([{
                userId,
                title: "Appointment Rescheduled",
                message: `Your appointment with Dr. ${doctorData.name} has been moved to ${newSlotDate} at ${newSlotTime}.`,
                type: "appointment"
            }], { session, ordered: true })
        })

        res.json({ success: true, message: 'Appointment Rescheduled Successfully' });

    } catch (error) {
        if (isAppointmentSlotConflict(error)) {
            return res.json({ success: false, message: 'New slot requested is not available' });
        }

        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get notifications
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.body;
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 20 });
        const query = { userId };

        const [totalItems, notifications] = await Promise.all([
            notificationModel.countDocuments(query),
            notificationModel.find(query).sort({ date: -1 }).skip(skip).limit(limit),
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

// API to mark notifications as read
const markNotificationsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        await notificationModel.updateMany({ userId, read: false }, { read: true });
        res.json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const getPrivacySummary = async (req, res) => {
    try {
        const { userId } = req.body;
        const [user, settings, requests] = await Promise.all([
            userModel.findById(userId),
            getOrCreateSettings(),
            privacyRequestModel.find({ userId }).sort({ requestedAt: -1 }).limit(20),
        ]);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const consent = user.privacyConsent?.acceptedAt
            ? {
                ...user.privacyConsent,
                isCurrent: isPrivacyConsentCurrent({ consent: user.privacyConsent, settings }),
            }
            : null;

        res.json({
            success: true,
            policyVersion: getPrivacyPolicyVersion(settings),
            deletionReviewWindowDays: getDeletionReviewWindowDays(settings),
            accountStatus: user.accountStatus || 'active',
            consent,
            requests: requests.map((request) => serializePrivacyRequest(request)),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const recordPrivacyConsent = async (req, res) => {
    try {
        const { userId } = req.body;
        const [user, settings] = await Promise.all([
            userModel.findById(userId),
            getOrCreateSettings(),
        ]);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        user.privacyConsent = buildPrivacyConsentRecord({
            version: getPrivacyPolicyVersion(settings),
            source: 'patient_portal',
        });
        await user.save();

        res.json({
            success: true,
            message: 'Privacy consent recorded successfully',
            consent: {
                ...user.privacyConsent,
                isCurrent: true,
            },
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const downloadPrivacyExport = async (req, res) => {
    try {
        const { userId } = req.body;
        const [user, settings, appointments, prescriptions, requests] = await Promise.all([
            userModel.findById(userId).select('+aadharNumber'),
            getOrCreateSettings(),
            appointmentModel.find({ userId }).sort({ date: -1 }),
            prescriptionModel.find({ userId }).sort({ date: -1 }),
            privacyRequestModel.find({ userId }).sort({ requestedAt: -1 }),
        ]);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const serializedRequests = requests.map((request) => serializePrivacyRequest(request));
        const exportPayload = buildPrivacyExportPayload({
            user,
            appointments,
            prescriptions,
            privacyRequests: serializedRequests,
            settings,
        });

        await privacyRequestModel.create({
            userId,
            type: 'data_export',
            status: 'completed',
            requestedBy: 'self',
            requestedAt: new Date(),
            completedAt: new Date(),
            responseMessage: 'User downloaded a privacy export package.',
            metadata: {
                appointmentCount: appointments.length,
                prescriptionCount: prescriptions.length,
            },
        });

        const filename = `mediflow-privacy-export-${new Date().toISOString().slice(0, 10)}.json`;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(JSON.stringify(exportPayload, null, 2));
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const listPrivacyRequests = async (req, res) => {
    try {
        const { userId } = req.body;
        const requests = await privacyRequestModel.find({ userId }).sort({ requestedAt: -1 }).limit(20);

        res.json({
            success: true,
            requests: requests.map((request) => serializePrivacyRequest(request)),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const createPrivacyRequest = async (req, res) => {
    try {
        const { userId, type, reason = '' } = req.body;
        const [user, settings, existingRequest] = await Promise.all([
            userModel.findById(userId),
            getOrCreateSettings(),
            privacyRequestModel.findOne({
                userId,
                type: 'account_deletion',
                status: { $in: ['pending', 'in_review', 'approved'] },
            }),
        ]);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (user.accountStatus === 'anonymized') {
            return res.json({ success: false, message: 'This account has already been anonymized' });
        }

        if (type !== 'account_deletion') {
            return res.json({ success: false, message: 'Unsupported privacy request type' });
        }

        if (existingRequest) {
            return res.json({ success: false, message: 'A deletion request is already active for this account' });
        }

        user.accountStatus = 'deletion_requested';
        user.deletionRequestedAt = new Date();
        await user.save();

        const request = await privacyRequestModel.create({
            userId,
            type,
            status: 'pending',
            requestedBy: 'self',
            reason,
            metadata: {
                policyVersion: getPrivacyPolicyVersion(settings),
                reviewWindowDays: getDeletionReviewWindowDays(settings),
            },
        });

        res.json({
            success: true,
            message: 'Deletion request submitted for review',
            request: serializePrivacyRequest(request),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


// API to get available slots for a doctor
const getDoctorSlots = async (req, res) => {
    try {
        const { docId } = req.params;
        const doctorData = await doctorModel.findById(docId);

        if (!doctorData) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        // Generate slots for next 7 days
        const slots = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);

            const daySlots = generateAvailableSlots(doctorData, currentDate);
            slots.push(daySlots);
        }

        res.json({ success: true, slots });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe,
    verifyEmail,
    forgotPassword,
    resetPassword,
    enable2FA,
    verify2FA,
    refreshSession,
    logoutUser,
    getFinancialSummary,
    getUserPrescriptions,
    getDoctorSlots,
    rescheduleAppointment,
    getNotifications,
    markNotificationsRead,
    getPrivacySummary,
    recordPrivacyConsent,
    downloadPrivacyExport,
    createPrivacyRequest,
    listPrivacyRequests,
}
