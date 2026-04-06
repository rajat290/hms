import appointmentModel from '../models/appointmentModel.js';
import auditLogModel from '../models/auditLogModel.js';
import doctorModel from '../models/doctorModel.js';
import invoiceModel from '../models/invoiceModel.js';
import paymentLogModel from '../models/paymentLogModel.js';
import staffModel from '../models/staffModel.js';
import userModel from '../models/userModel.js';

const getAppointmentsPage = async ({ skip, limit }) => Promise.all([
    appointmentModel.countDocuments({}),
    appointmentModel.find({}).sort({ date: -1 }).skip(skip).limit(limit),
]);

const getDoctorsPage = async ({ skip, limit }) => Promise.all([
    doctorModel.countDocuments({}),
    doctorModel.find({}).select('-password').sort({ date: -1 }).skip(skip).limit(limit),
]);

const getPatientsPage = async ({ skip, limit }) => Promise.all([
    userModel.countDocuments({}),
    userModel.find({}).select('-password').sort({ _id: -1 }).skip(skip).limit(limit),
]);

const getInvoicesPage = async ({ skip, limit }) => Promise.all([
    invoiceModel.countDocuments({}),
    invoiceModel.find({})
        .populate('patientId', 'name email phone')
        .populate('appointmentId', 'slotDate slotTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
]);

const getPaymentHistoryPage = async ({ appointmentId, skip, limit }) => Promise.all([
    paymentLogModel.countDocuments({ appointmentId }),
    paymentLogModel.find({ appointmentId }).sort({ timestamp: -1 }).skip(skip).limit(limit),
]);

const getAuditLogsPage = async ({ skip, limit }) => Promise.all([
    auditLogModel.countDocuments({}),
    auditLogModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
]);

const getStaffPage = async ({ skip, limit }) => Promise.all([
    staffModel.countDocuments({}),
    staffModel.find({}).select('-password').sort({ date: -1 }).skip(skip).limit(limit),
]);

const getDashboardSnapshot = async () => {
    const [doctorCount, patientCount, appointmentCount, latestAppointments] = await Promise.all([
        doctorModel.countDocuments({}),
        userModel.countDocuments({}),
        appointmentModel.countDocuments({}),
        appointmentModel.find({}).sort({ date: -1 }).limit(5),
    ]);

    return {
        doctorCount,
        patientCount,
        appointmentCount,
        latestAppointments,
    };
};

export {
    getAppointmentsPage,
    getAuditLogsPage,
    getDashboardSnapshot,
    getDoctorsPage,
    getInvoicesPage,
    getPatientsPage,
    getPaymentHistoryPage,
    getStaffPage,
};
