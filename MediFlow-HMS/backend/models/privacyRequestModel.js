import mongoose from 'mongoose';

const privacyRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    type: { type: String, enum: ['data_export', 'account_deletion'], required: true },
    status: {
        type: String,
        enum: ['pending', 'in_review', 'approved', 'rejected', 'completed'],
        default: 'pending',
        index: true,
    },
    requestedBy: { type: String, enum: ['self', 'admin', 'system'], default: 'self' },
    requestedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, default: '' },
    responseMessage: { type: String, default: '' },
    completedAt: { type: Date },
    metadata: { type: Object, default: {} },
}, { timestamps: true, minimize: false });

privacyRequestSchema.index({ userId: 1, type: 1, status: 1 });

const privacyRequestModel = mongoose.models.privacyrequest || mongoose.model('privacyrequest', privacyRequestSchema);

export default privacyRequestModel;
