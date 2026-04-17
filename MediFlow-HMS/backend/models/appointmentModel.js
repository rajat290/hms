import mongoose from "mongoose";
import { deriveVisitStatusFromLegacyFlags, syncLegacyAppointmentFlags } from "../utils/appointmentLifecycle.js";

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    docId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    slotTime: { type: String, required: true },
    slotDate: { type: String, required: true },
    date: { type: Number, required: true },
    visitStatus: {
        type: String,
        enum: ['requested', 'accepted', 'checked_in', 'in_consultation', 'completed', 'cancelled'],
        default: 'requested',
    },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isAccepted: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    notes: [{ type: String }],
    paymentStatus: { type: String, enum: ['paid', 'partially paid', 'unpaid', 'refunded'], default: 'unpaid' },
    partialAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Online', 'N/A'], default: 'N/A' },
    isCheckedIn: { type: Boolean, default: false },
    billingItems: [{
        name: { type: String },
        cost: { type: Number }
    }],
    acceptedAt: { type: Date },
    checkedInAt: { type: Date },
    consultationStartedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    lastStatusUpdatedAt: { type: Date },
    cancellationReason: { type: String },
    rescheduledCount: { type: Number, default: 0 },
    lastRescheduledAt: { type: Date },
    invoiceDate: { type: Date },
    reminderSent24h: { type: Boolean, default: false },
    reminderSent2h: { type: Boolean, default: false },
    reminderSent24hAt: { type: Date },
    reminderSent2hAt: { type: Date },
    reminder24hLockUntil: { type: Date },
    reminder2hLockUntil: { type: Date }
})

appointmentSchema.index(
    { docId: 1, slotDate: 1, slotTime: 1 },
    { unique: true, partialFilterExpression: { cancelled: false } }
)

appointmentSchema.pre('validate', function syncVisitLifecycle(next) {
    const legacyFlagsChanged = this.isModified('cancelled')
        || this.isModified('isAccepted')
        || this.isModified('isCheckedIn')
        || this.isModified('isCompleted')

    if (this.isModified('visitStatus')) {
        syncLegacyAppointmentFlags(this)
        this.lastStatusUpdatedAt = this.lastStatusUpdatedAt || new Date()
        return next()
    }

    if (legacyFlagsChanged) {
        this.visitStatus = deriveVisitStatusFromLegacyFlags(this, { preferVisitStatus: false })
        syncLegacyAppointmentFlags(this)
        this.lastStatusUpdatedAt = this.lastStatusUpdatedAt || new Date()
        return next()
    }

    if (!this.visitStatus) {
        syncLegacyAppointmentFlags(this)
        this.lastStatusUpdatedAt = this.lastStatusUpdatedAt || new Date()
    }

    next()
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);
export default appointmentModel;
