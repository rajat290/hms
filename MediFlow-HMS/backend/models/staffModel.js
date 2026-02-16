import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    role: { type: String, default: 'Staff' },
    dob: { type: String },
    phone: { type: String },
    date: { type: Number, required: true },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
}, { minimize: false })

const staffModel = mongoose.models.staff || mongoose.model("staff", staffSchema);
export default staffModel;
