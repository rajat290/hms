import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import settingsModel from "../models/settingsModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { generateAvailableSlots } from "../utils/slotGenerator.js";
import notificationModel from "../models/notificationModel.js";
import { ensureInvoiceForAppointment, finalizeAppointmentPayment, isAppointmentSlotConflict, releaseDoctorSlot, reserveDoctorSlot } from "../utils/appointmentIntegrity.js";
import { issueAuthTokens, revokeAllSessionsForSubject, revokeSessionById, rotateRefreshSession } from "../utils/authSessions.js";
import { runInTransaction } from "../utils/transaction.js";

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const userData = {
            name,
            email,
            password: hashedPassword,
            verificationToken
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const verificationUrl = `${req.headers.origin}/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification - Mediflow',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to Mediflow!</h2>
                    <p>Please click the button below to verify your email address and activate your account:</p>
                    <a href="${verificationUrl}" style="background-color: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${verificationUrl}</p>
                    <p>Thank you,<br>The Mediflow Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Registration successful! Please check your email to verify your account.' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            if (!user.isVerified) {
                // Resend verification email
                const verificationToken = crypto.randomBytes(32).toString('hex');
                user.verificationToken = verificationToken;
                await user.save();

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const verificationUrl = `${req.headers.origin}/verify-email?token=${verificationToken}`;

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Verify Your Email - Mediflow',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Email Verification Required</h2>
                            <p>Please click the button below to verify your email address:</p>
                            <a href="${verificationUrl}" style="background-color: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
                            <p>Thank you,<br>The Mediflow Team</p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                return res.json({ success: false, message: "Email not verified. A new verification link has been sent to your email." })
            }

            if (user.twoFactorEnabled) {
                // Generate and send 2FA code
                const code = crypto.randomInt(100000, 999999).toString();
                user.twoFactorCode = code;
                user.twoFactorCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
                await user.save();

                // Send email
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: '2FA Verification Code - Mediflow',
                    html: `<h3>Your 2FA code is: ${code}</h3><p>Use this code to complete your login.</p>`
                };
                await transporter.sendMail(mailOptions);

                return res.json({ success: true, twoFactorRequired: true, userId: user._id, message: "2FA code sent to your email." });
            }

            const session = await issueAuthTokens({
                subjectId: user._id,
                role: 'user',
                req,
            });
            res.json({ success: true, ...session })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

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

            const doctorSnapshot = docData.toObject()
            delete doctorSnapshot.slots_booked

            const appointmentData = {
                userId,
                docId,
                userData: userData.toObject(),
                docData: doctorSnapshot,
                amount: docData.fees,
                slotTime,
                slotDate,
                date: Date.now(),
                paymentMethod: paymentMethod || 'Cash',
                patientInfo: patientInfo || null
            }

            const [createdAppointment] = await appointmentModel.create([appointmentData], { session })

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
            ], { session })

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

            if (appointmentData.isAccepted) {
                throw new Error('Appointment accepted by doctor. Cancellation Restricted.')
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

            appointmentData.cancelled = true
            await appointmentData.save({ session })

            await releaseDoctorSlot({
                docId: appointmentData.docId,
                slotDate: appointmentData.slotDate,
                slotTime: appointmentData.slotTime,
                session,
            })

            await ensureInvoiceForAppointment(appointmentData, session, { createIfMissing: false })
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
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

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
        const prescriptions = await prescriptionModel.find({ userId });
        res.json({ success: true, prescriptions });
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
        const user = await userModel.findOne({ verificationToken: token });
        if (!user) {
            return res.json({ success: false, message: 'Invalid token' });
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();
        // send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetUrl = `${req.headers.origin}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset - Mediflow',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Please click the button below to set a new password:</p>
                    <a href="${resetUrl}" style="background-color: #5f6FFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Thank you,<br>The Mediflow Team</p>
                </div>
            `
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.json({ success: true, message: 'Reset token sent to email' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to reset password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await userModel.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) {
            return res.json({ success: false, message: 'Invalid or expired token' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        user.isVerified = true;
        user.verificationToken = undefined;
        user.twoFactorCode = undefined;
        user.twoFactorCodeExpiry = undefined;
        await user.save();

        await revokeAllSessionsForSubject({
            subjectId: user._id,
            role: 'user',
            reason: 'Password reset',
        });

        const session = await issueAuthTokens({
            subjectId: user._id,
            role: 'user',
            req,
        });

        res.json({ success: true, message: 'Password reset successfully', ...session });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to enable 2FA
const enable2FA = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        user.twoFactorEnabled = true;
        user.twoFactorCode = undefined;
        user.twoFactorCodeExpiry = undefined;
        await user.save();
        res.json({ success: true, message: '2FA enabled. Future logins will require an email verification code.' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to verify 2FA
const verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;
        const user = await userModel.findById(userId);
        if (!user || !user.twoFactorEnabled) {
            return res.json({ success: false, message: '2FA not enabled' });
        }
        if (!user.twoFactorCode || user.twoFactorCodeExpiry <= new Date()) {
            user.twoFactorCode = undefined;
            user.twoFactorCodeExpiry = undefined;
            await user.save();
            return res.json({ success: false, message: '2FA code expired. Please login again.' });
        }
        if (user.twoFactorCode !== code) {
            return res.json({ success: false, message: 'Invalid code' });
        }
        user.twoFactorCode = undefined;
        user.twoFactorCodeExpiry = undefined;
        await user.save();

        const session = await issueAuthTokens({
            subjectId: user._id,
            role: 'user',
            req,
        });

        res.json({ success: true, message: '2FA verified', ...session });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const refreshSession = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const session = await rotateRefreshSession(refreshToken, 'user', req);

        res.json({ success: true, ...session });
    } catch (error) {
        console.log(error);
        res.status(401).json({ success: false, message: error.message || 'Session refresh failed' });
    }
}

const logoutUser = async (req, res) => {
    try {
        await revokeSessionById(req.auth?.sessionId, 'User logout');
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

            if (appointment.cancelled || appointment.isCompleted) {
                throw new Error('Cannot reschedule cancelled or completed appointment');
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
            }], { session })
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
        const notifications = await notificationModel.find({ userId }).sort({ date: -1 }).limit(20);
        res.json({ success: true, notifications });
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
    markNotificationsRead
}
