import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import reviewModel from "../models/reviewModel.js";

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
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
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
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

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
        let filter = {};

        if (speciality) filter.speciality = speciality;
        if (gender) filter.gender = gender;
        if (maxFees) filter.fees = { $lte: Number(maxFees) };
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const doctors = await doctorModel.find(filter).select(['-password', '-email'])
        res.json({ success: true, doctors })

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
        const reviews = await reviewModel.find({ docId }).populate('userId', 'name image');
        res.json({ success: true, reviews });
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
    getDoctorReviews
}
