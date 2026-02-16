import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    cancellationWindow: { type: Number, default: 24, required: true }, // Window in hours
    currency: { type: String, default: 'INR' }
}, { minimize: false })

const settingsModel = mongoose.models.settings || mongoose.model("settings", settingsSchema);
export default settingsModel;
