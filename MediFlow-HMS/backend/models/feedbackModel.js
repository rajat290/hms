import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    date: { type: Number, required: true }
})

const feedbackModel = mongoose.models.feedback || mongoose.model("feedback", feedbackSchema);
export default feedbackModel;
