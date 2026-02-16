import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: true
    },
    items: [{
        description: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid', 'overdue', 'cancelled'],
        default: 'unpaid'
    },
    dueDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
invoiceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const invoiceModel = mongoose.models.invoice || mongoose.model('invoice', invoiceSchema);

export default invoiceModel;
