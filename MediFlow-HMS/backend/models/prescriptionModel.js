import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    docId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment', required: true },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
        instruction: { type: String }
    }],
    instructions: { type: String },
    date: { type: Number, required: true }
})

const prescriptionModel = mongoose.models.prescription || mongoose.model("prescription", prescriptionSchema);
export default prescriptionModel;
