import staffModel from "../models/staffModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import crypto from 'crypto';

// API for staff login
const loginStaff = async (req, res) => {
    try {
        const { email, password } = req.body;
        const staff = await staffModel.findOne({ email });

        if (!staff) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, staff.password);

        if (isMatch) {
            const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get staff profile data
const getProfile = async (req, res) => {
    try {
        const { staffId } = req.body;
        const staff = await staffModel.findById(staffId).select('-password');
        res.json({ success: true, staff });
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
        const appointments = await appointmentModel.find({}).populate('docId', 'name speciality image').populate('userId', 'name dob gender image')
        res.json({ success: true, appointments: appointments.reverse() })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
        res.json({ success: true, message: 'Appointment Cancelled' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all patients
const getAllPatients = async (req, res) => {
    try {
        const patients = await userModel.find({}).select('-password')
        res.json({ success: true, patients })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to create patient (Staff)
const createPatient = async (req, res) => {
    try {
        const {
            name, email, phone, dob, gender, medicalRecordNumber, aadharNumber,
            insuranceProvider, insuranceId, address, emergencyContact
        } = req.body;

        if (!name || !email || !phone || !dob || !gender) {
            return res.json({ success: false, message: 'Name, Email, Phone, DOB and Gender are required' });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' });
        }

        // Check for existing patient (only if unique identifiers are provided)
        let query = [{ email }, { phone }];
        if (medicalRecordNumber) query.push({ medicalRecordNumber });
        if (aadharNumber) query.push({ aadharNumber });

        const existingPatient = await userModel.findOne({ $or: query });

        if (existingPatient) {
            return res.json({ success: false, message: 'Patient with this details already exists' });
        }

        const tempPassword = crypto.randomBytes(8).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

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

        const patientData = {
            name,
            email,
            phone,
            dob,
            gender,
            patientCategory: req.body.patientCategory || 'Standard',
            chronicConditions: req.body.chronicConditions || '',
            address: typeof address === 'string' ? JSON.parse(address) : address,
            emergencyContact: typeof emergencyContact === 'string' ? JSON.parse(emergencyContact) : emergencyContact,
            image: profileImageUrl,
            aadharImage: aadharImageUrl,
            password: hashedPassword,
            date: Date.now()
        };

        if (medicalRecordNumber) patientData.medicalRecordNumber = medicalRecordNumber;
        if (aadharNumber) patientData.aadharNumber = aadharNumber;
        if (insuranceProvider) patientData.insuranceProvider = insuranceProvider;
        if (insuranceId) patientData.insuranceId = insuranceId;

        const patient = new userModel(patientData);
        await patient.save();

        res.json({
            success: true,
            message: 'Patient created successfully',
            credentials: { email, password: tempPassword }
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
            latestAppointments: appointments.reverse().slice(0, 5)
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

        // If date is provided, filter by it. Otherwise return all (or logic could specific to today)
        // For now, let's keep it flexible. If date matches slotDate

        let query = {};
        if (date) {
            query.slotDate = date;
        }

        const appointments = await appointmentModel.find(query).populate('docId', 'name speciality image').populate('userId', 'name dob gender image')
        res.json({ success: true, appointments: appointments.reverse() })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark check-in
const markCheckIn = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointment = await appointmentModel.findByIdAndUpdate(appointmentId, { isCheckedIn: true }).populate('userId', 'name');

        // Create notification for staff
        const staffNotification = new notificationModel({
            recipientType: 'staff',
            title: "Patient Checked In",
            message: `Patient ${appointment.userId.name} has checked in for their appointment.`,
            type: "appointment"
        })
        await staffNotification.save()

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

        let updateData = { paymentStatus };

        if (paymentMethod) updateData.paymentMethod = paymentMethod;
        if (partialAmount !== undefined) {
            // For itemized billing, partialAmount we receive is the new Grand Total
            updateData.amount = partialAmount;
            updateData.partialAmount = partialAmount;
        }
        if (billingItems) updateData.billingItems = billingItems;
        updateData.invoiceDate = Date.now();

        // If status is paid, set payment boolean to true
        if (paymentStatus === 'paid') {
            updateData.payment = true;
        }

        const appointment = await appointmentModel.findByIdAndUpdate(appointmentId, updateData).populate('userId', 'name');

        // Create notification for staff
        const staffNotification = new notificationModel({
            recipientType: 'staff',
            title: "Payment Received",
            message: `Payment of ${partialAmount || appointment.amount} received from ${appointment.userId.name} via ${paymentMethod || 'standard method'}.`,
            type: "payment"
        })
        await staffNotification.save()

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
        const notifications = await notificationModel.find({
            $or: [
                { staffId },
                { recipientType: 'staff' },
                { recipientType: 'all' }
            ]
        }).sort({ date: -1 });
        res.json({ success: true, notifications });
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

export { loginStaff, getProfile, updateProfile, getAllAppointments, cancelAppointment, getAllPatients, createPatient, staffDashboard, getDailyAppointments, markCheckIn, updatePayment, getStaffNotifications, markNotificationRead }
