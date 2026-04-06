import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import reviewModel from "../models/reviewModel.js";
import crypto from 'crypto';
import validator from "validator";
import { cancelAppointmentRecord } from "../utils/appointmentIntegrity.js";
import { parsePaginationQuery, sendPaginatedResponse } from "../utils/pagination.js";
import { issueAuthTokens, revokeAllSessionsForSubject, revokeSessionById, rotateRefreshSession } from "../utils/authSessions.js";
import { runInTransaction } from "../utils/transaction.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";

// API to verify email for doctor
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const doctor = await doctorModel.findOne({ verificationToken: token });
        if (!doctor) {
            return res.json({ success: false, message: 'Invalid token' });
        }
        doctor.isVerified = true;
        doctor.verificationToken = undefined;
        await doctor.save();
        res.json({ success: true, message: 'Doctor email verified successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            if (!user.isVerified) {
                const verificationToken = crypto.randomBytes(32).toString('hex');
                user.verificationToken = verificationToken;
                await user.save();

                await sendVerificationEmail({
                    email,
                    origin: req.headers.origin,
                    token: verificationToken,
                    role: 'doctor',
                    subject: 'Verify Your Doctor Account - Mediflow',
                    heading: 'Email Verification Required',
                    body: 'Please click the button below to verify your doctor account.',
                });
                return res.json({ success: false, message: "Email not verified. A new verification link has been sent." })
            }
            const session = await issueAuthTokens({
                subjectId: user._id,
                role: 'doctor',
                req,
            });
            res.json({ success: true, ...session })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 50 })
        const query = { docId }

        const [totalItems, appointments] = await Promise.all([
            appointmentModel.countDocuments(query),
            appointmentModel.find(query).sort({ date: -1 }).skip(skip).limit(limit),
        ])

        sendPaginatedResponse(res, {
            message: 'Doctor appointments fetched successfully',
            itemKey: 'appointments',
            items: appointments,
            page,
            limit,
            totalItems,
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        await runInTransaction(async (session) => {
            const appointmentData = await appointmentModel.findById(appointmentId).session(session)

            if (!appointmentData || appointmentData.docId.toString() !== docId) {
                throw new Error('Unauthorized or appointment not found')
            }

            await cancelAppointmentRecord({ appointmentId, session })
        })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment accepted for doctor panel
const appointmentAccept = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isAccepted: true })
            return res.json({ success: true, message: 'Appointment Accepted' })
        }
        res.json({ success: false, message: 'Appointment Cancelled' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all doctors list for Frontend with Advanced Filters
const doctorList = async (req, res) => {
    try {
        const { speciality, gender, maxFees, search } = req.query;
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 24 });
        let filter = {};

        if (speciality) filter.speciality = speciality;
        if (gender) filter.gender = gender;
        if (maxFees) filter.fees = { $lte: Number(maxFees) };
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const [totalItems, doctors] = await Promise.all([
            doctorModel.countDocuments(filter),
            doctorModel.find(filter)
                .select(['-password', '-email'])
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
        ])

        sendPaginatedResponse(res, {
            message: 'Doctors fetched successfully',
            itemKey: 'doctors',
            items: doctors,
            page,
            limit,
            totalItems,
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.paymentStatus === 'paid') {
                earnings += item.amount;
            } else if (item.paymentStatus === 'partially paid') {
                earnings += item.partialAmount;
            } else if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to add notes to appointment
const addAppointmentNotes = async (req, res) => {
    try {
        const { docId, appointmentId, notes } = req.body;
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || appointment.docId.toString() !== docId) {
            return res.json({ success: false, message: 'Unauthorized or appointment not found' });
        }
        if (!notes?.trim()) {
            return res.json({ success: false, message: 'Note text is required' });
        }
        appointment.notes.push(notes);
        await appointment.save();
        res.json({ success: true, message: 'Notes added' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to generate prescription for doctor
const generatePrescriptionDoctor = async (req, res) => {
    try {
        const { docId, appointmentId, medicines } = req.body;
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || appointment.docId.toString() !== docId) {
            return res.json({ success: false, message: 'Unauthorized or appointment not found' });
        }
        const prescription = new prescriptionModel({
            userId: appointment.userId,
            docId,
            appointmentId,
            medicines,
            date: Date.now()
        });
        await prescription.save();
        res.json({ success: true, message: 'Prescription generated', prescription });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get patient financial summary for doctor
const getPatientFinancialSummary = async (req, res) => {
    try {
        const { docId, userId } = req.body;
        // Check if doctor has appointments with this user
        const hasAppointment = await appointmentModel.findOne({ docId, userId });
        if (!hasAppointment) {
            return res.json({ success: false, message: 'Unauthorized' });
        }
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


// API to get doctor's availability settings
const getAvailability = async (req, res) => {
    try {
        const { docId } = req.body;
        const doctorData = await doctorModel.findById(docId).select('availability');

        if (!doctorData) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        res.json({ success: true, availability: doctorData.availability });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to add a review for a doctor
const addReview = async (req, res) => {
    try {
        const { userId, docId, appointmentId, rating, comment } = req.body;

        // Verify appointment completion and ownership
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || appointment.userId.toString() !== userId || !appointment.isCompleted) {
            return res.json({ success: false, message: "You can only review completed appointments." });
        }

        // Check if already reviewed
        const existingReview = await reviewModel.findOne({ appointmentId });
        if (existingReview) {
            return res.json({ success: false, message: "You have already reviewed this appointment." });
        }

        const newReview = new reviewModel({ userId, docId, appointmentId, rating, comment });
        await newReview.save();

        res.json({ success: true, message: "Review added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get reviews for a doctor
const getDoctorReviews = async (req, res) => {
    try {
        const { docId } = req.params;
        const { page, limit, skip } = parsePaginationQuery(req.query, { defaultLimit: 20 });
        const query = { docId };

        const [totalItems, reviews] = await Promise.all([
            reviewModel.countDocuments(query),
            reviewModel.find(query)
                .populate('userId', 'name image')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        sendPaginatedResponse(res, {
            message: 'Doctor reviews fetched successfully',
            itemKey: 'reviews',
            items: reviews,
            page,
            limit,
            totalItems,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to update doctor's availability settings
const updateAvailability = async (req, res) => {
    try {
        const { docId, availability } = req.body;

        await doctorModel.findByIdAndUpdate(docId, { availability });

        res.json({ success: true, message: 'Availability updated successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to forgot password for doctor
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const doctor = await doctorModel.findOne({ email });
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        doctor.resetToken = resetToken;
        doctor.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await doctor.save();

        await sendPasswordResetEmail({
            email,
            origin: req.headers.origin,
            token: resetToken,
            role: 'doctor',
            subject: 'Password Reset - Mediflow Doctor Panel',
            accountLabel: 'Doctor account',
        });
        res.json({ success: true, message: 'Reset link sent to your email' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to reset password for doctor
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const doctor = await doctorModel.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!doctor) {
            return res.json({ success: false, message: 'Invalid or expired token' });
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password (min 8 chars)" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        doctor.password = hashedPassword;
        doctor.resetToken = undefined;
        doctor.resetTokenExpiry = undefined;
        doctor.isVerified = true;
        doctor.verificationToken = undefined;
        await doctor.save();

        await revokeAllSessionsForSubject({
            subjectId: doctor._id,
            role: 'doctor',
            reason: 'Password reset',
        });

        const session = await issueAuthTokens({
            subjectId: doctor._id,
            role: 'doctor',
            req,
        });

        res.json({ success: true, message: 'Password reset successfully', ...session });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const refreshSession = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const session = await rotateRefreshSession(refreshToken, 'doctor', req);

        res.json({ success: true, ...session });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: error.message || 'Session refresh failed' });
    }
}

const logoutDoctor = async (req, res) => {
    try {
        await revokeSessionById(req.auth?.sessionId, 'Doctor logout');
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    appointmentAccept,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    addAppointmentNotes,
    generatePrescriptionDoctor,
    getPatientFinancialSummary,
    getAvailability,
    updateAvailability,
    addReview,
    getDoctorReviews,
    forgotPassword,
    resetPassword,
    refreshSession,
    logoutDoctor,
    verifyEmail
}
