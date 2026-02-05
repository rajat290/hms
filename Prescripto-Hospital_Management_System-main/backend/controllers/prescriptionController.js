import prescriptionModel from "../models/prescriptionModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";

// API to generate prescription
const generatePrescription = async (req, res) => {
    try {
        const { appointmentId, medicines } = req.body;
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }
        const prescription = new prescriptionModel({
            userId: appointment.userId,
            appointmentId,
            medicines
        });
        await prescription.save();
        res.json({ success: true, message: 'Prescription generated', prescription });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get prescriptions for a user
const getUserPrescriptions = async (req, res) => {
    try {
        const { userId } = req.body;
        const prescriptions = await prescriptionModel.find({ userId }).populate('appointmentId');
        res.json({ success: true, prescriptions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get prescriptions for a doctor (for their patients)
const getDoctorPrescriptions = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });
        const appointmentIds = appointments.map(app => app._id);
        const prescriptions = await prescriptionModel.find({ appointmentId: { $in: appointmentIds } }).populate('userId appointmentId');
        res.json({ success: true, prescriptions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { generatePrescription, getUserPrescriptions, getDoctorPrescriptions };
