import mongoose from "mongoose";
import {
    DEFAULT_DELETION_REVIEW_WINDOW_DAYS,
    DEFAULT_PRIVACY_POLICY_VERSION,
} from '../utils/privacy.js';

const settingsSchema = new mongoose.Schema({
    cancellationWindow: { type: Number, default: 24, required: true }, // Window in hours
    currency: { type: String, default: 'INR' },
    privacyPolicyVersion: { type: String, default: DEFAULT_PRIVACY_POLICY_VERSION },
    deletionReviewWindowDays: { type: Number, default: DEFAULT_DELETION_REVIEW_WINDOW_DAYS },
}, { minimize: false })

const settingsModel = mongoose.models.settings || mongoose.model("settings", settingsSchema);
export default settingsModel;
