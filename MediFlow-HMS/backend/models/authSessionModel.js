import mongoose from 'mongoose';

const authSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    subjectId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'doctor', 'staff', 'admin'], required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date },
    revokedReason: { type: String, default: '' },
    lastUsedAt: { type: Date },
    lastRotatedAt: { type: Date },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
}, { timestamps: true, minimize: false });

authSessionSchema.index({ role: 1, subjectId: 1, revokedAt: 1 });

const authSessionModel = mongoose.models.authSession || mongoose.model('authSession', authSessionSchema);

export default authSessionModel;
