import jwt from "jsonwebtoken";
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

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

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
            // if (!user.isVerified) {
            //     return res.json({ success: false, message: "Please verify your email before logging in." })
            // }
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
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

        const { userId, docId, slotDate, slotTime, patientInfo } = req.body
        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            }
            else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData: userData.toObject(),
            docData: docData.toObject(),
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            patientInfo: patientInfo || null
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Booked', appointmentId: newAppointment._id })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body

        // 1. Check if appointment exists
        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        // 2. Check ownership
        if (appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        // 3. Check if already accepted
        if (appointmentData.isAccepted) {
            return res.json({ success: false, message: 'Appointment accepted by doctor. Cancellation Restricted.' })
        }


        // 4. Check Cancellation Window (Time Restriction)
        const settings = await settingsModel.findOne({})
        const cancelWindow = settings ? settings.cancellationWindow : 2 // Default 2 hours

        const { slotDate, slotTime } = appointmentData

        // Parse "24_01_2000" and "10:00" / "10:30 PM"
        const dateParts = slotDate.split('_')
        let day = parseInt(dateParts[0])
        let month = parseInt(dateParts[1]) - 1
        let year = parseInt(dateParts[2])

        let appointmentDateTime = new Date(year, month, day)

        // Parse Time
        // slotTime is usually "10:00" or "09:30". Assumed 24h or handled.
        // If the format is "10:00 AM" or "10:00 PM", we need to handle it.
        // Based on Appointment.jsx: `currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })`
        // This might return "10:30 AM" or "10:30" depending on locale.
        // Let's assume standard "HH:MM" or handle AM/PM crudely if needed.

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

        // If appointment is in the past, definitely cannot cancel (unless logic allows?)
        // Usually past appointments are handled by "Completed" or "Missed". 
        // But for "Cancellation Window", it usually means "Before X hours".

        if (diffHours < cancelWindow) {
            return res.json({ success: false, message: `Cancellation restricted within ${cancelWindow} hours of appointment.` })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // Releasing doctor slot 
        const { docId } = appointmentData
        const doctorData = await doctorModel.findById(docId)
        let slots_booked = doctorData.slots_booked
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })
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

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: 'INR',
            receipt: appointmentId,
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
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true, paymentStatus: 'paid' })
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true, paymentStatus: 'paid' })
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
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            text: `Your reset token is ${resetToken}`
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
        await user.save();
        res.json({ success: true, message: 'Password reset successfully' });
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
        // generate a simple code
        const code = crypto.randomInt(100000, 999999).toString();
        user.verificationToken = code; // using verificationToken for code
        await user.save();
        res.json({ success: true, message: '2FA enabled, code generated', code }); // in real app, don't send code in response
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
        if (user.verificationToken !== code) {
            return res.json({ success: false, message: 'Invalid code' });
        }
        user.verificationToken = undefined;
        await user.save();
        res.json({ success: true, message: '2FA verified' });
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
    getFinancialSummary,
    getUserPrescriptions,
    getDoctorSlots
}
