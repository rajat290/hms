import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    docId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    slotTime: { type: String, required: true },
    slotDate: { type: String, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isAccepted: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    notes: [{ type: String }],
    paymentStatus: { type: String, enum: ['paid', 'partially paid', 'unpaid'], default: 'unpaid' },
    partialAmount: { type: Number, default: 0 },
    patientInfo: { type: Object, default: null }
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);
export default appointmentModel;
