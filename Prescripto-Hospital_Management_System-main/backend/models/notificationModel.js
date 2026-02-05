import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['system', 'appointment', 'payment'], default: 'system' },
    read: { type: Boolean, default: false },
    date: { type: Number, default: Date.now() }
})

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);
export default notificationModel;
