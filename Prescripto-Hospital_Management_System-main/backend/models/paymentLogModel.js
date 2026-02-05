import mongoose from "mongoose";

const paymentLogSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['payment', 'refund', 'partial_payment'], required: true },
    method: { type: String, enum: ['cash', 'online', 'card'], default: 'cash' },
    status: { type: String, enum: ['completed', 'pending', 'failed', 'refunded'], default: 'completed' },
    transactionId: { type: String },
    notes: { type: String },
    processedBy: { type: String }, // admin email who processed
    timestamp: { type: Date, default: Date.now }
})

const paymentLogModel = mongoose.models.paymentLog || mongoose.model("paymentLog", paymentLogSchema);
export default paymentLogModel;
