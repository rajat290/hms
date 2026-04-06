import crypto from 'crypto';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import invoiceModel from '../models/invoiceModel.js';
import paymentLogModel from '../models/paymentLogModel.js';

const INVOICE_DUE_DAYS = 30;

const normalizeAppointmentPaymentMethod = (paymentMethod = 'N/A') => {
  const normalizedValue = String(paymentMethod || '').trim().toLowerCase();

  switch (normalizedValue) {
    case 'cash':
      return 'Cash';
    case 'card':
      return 'Card';
    case 'upi':
      return 'UPI';
    case 'online':
      return 'Online';
    default:
      return 'N/A';
  }
};

const normalizePaymentLogMethod = (paymentMethod = 'cash') => {
  const normalizedValue = String(paymentMethod || '').trim().toLowerCase();

  if (normalizedValue === 'upi') {
    return 'online';
  }

  if (['cash', 'card', 'online'].includes(normalizedValue)) {
    return normalizedValue;
  }

  return 'cash';
};

const getInvoiceStatusForAppointment = (appointment, existingInvoice = null) => {
  if (appointment.paymentStatus === 'refunded') {
    return 'refunded';
  }

  if (appointment.paymentStatus === 'paid') {
    return 'paid';
  }

  if (appointment.paymentStatus === 'partially paid') {
    if (existingInvoice?.dueDate && new Date(existingInvoice.dueDate) < new Date()) {
      return 'overdue';
    }
    return 'partially paid';
  }

  if (appointment.cancelled) {
    return 'cancelled';
  }

  if (existingInvoice?.dueDate && new Date(existingInvoice.dueDate) < new Date()) {
    return 'overdue';
  }

  return 'unpaid';
};

const buildInvoiceItemsFromAppointment = (appointment) => {
  if (Array.isArray(appointment.billingItems) && appointment.billingItems.length > 0) {
    return appointment.billingItems.map((item) => ({
      description: item.name || 'Billing item',
      quantity: 1,
      unitPrice: Number(item.cost || 0),
      total: Number(item.cost || 0),
    }));
  }

  const doctorName = appointment.docData?.name || 'Unknown';
  const doctorLabel = /^dr\.?\s/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`;

  return [
    {
      description: `Consultation with ${doctorLabel} (${appointment.docData?.speciality || 'General'})`,
      quantity: 1,
      unitPrice: appointment.amount,
      total: appointment.amount,
    },
  ];
};

const generateInvoiceNumber = () => {
  const timestamp = new Date();
  const stamp = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}`;
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `INV-${stamp}-${token}`;
};

const buildInvoiceMutation = (appointment, existingInvoice = null) => ({
  patientId: appointment.userId,
  appointmentId: appointment._id,
  items: buildInvoiceItemsFromAppointment(appointment),
  totalAmount: appointment.amount,
  status: getInvoiceStatusForAppointment(appointment, existingInvoice),
  updatedAt: new Date(),
});

const ensureInvoiceForAppointment = async (appointment, session, { createIfMissing = true } = {}) => {
  const existingInvoice = await invoiceModel.findOne({ appointmentId: appointment._id }).session(session);

  if (!createIfMissing && !existingInvoice) {
    return null;
  }

  const invoiceUpdate = buildInvoiceMutation(appointment, existingInvoice);

  if (existingInvoice) {
    return invoiceModel.findByIdAndUpdate(
      existingInvoice._id,
      { $set: invoiceUpdate },
      { new: true, session }
    );
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await invoiceModel.findOneAndUpdate(
        { appointmentId: appointment._id },
        {
          $set: invoiceUpdate,
          $setOnInsert: {
            invoiceNumber: generateInvoiceNumber(),
            dueDate: new Date(Date.now() + INVOICE_DUE_DAYS * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          session,
        }
      );
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.appointmentId) {
        return invoiceModel.findOne({ appointmentId: appointment._id }).session(session);
      }

      if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Failed to generate a unique invoice number.');
};

const ensureInvoiceForAppointmentId = async (appointmentId, session, options) => {
  const appointment = await appointmentModel.findById(appointmentId).session(session);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  return ensureInvoiceForAppointment(appointment, session, options);
};

const reserveDoctorSlot = async ({ docId, slotDate, slotTime, session }) => {
  await doctorModel.updateOne(
    { _id: docId },
    { $addToSet: { [`slots_booked.${slotDate}`]: slotTime } },
    { session }
  );
};

const releaseDoctorSlot = async ({ docId, slotDate, slotTime, session }) => {
  await doctorModel.updateOne(
    { _id: docId },
    { $pull: { [`slots_booked.${slotDate}`]: slotTime } },
    { session }
  );
};

const finalizeAppointmentPayment = async ({
  appointmentId,
  transactionId,
  paymentMethod = 'Online',
  notes = '',
  processedBy = 'system',
  session,
}) => {
  const appointment = await appointmentModel.findById(appointmentId).session(session);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.cancelled) {
    throw new Error('Cannot process payment for a cancelled appointment');
  }

  const previousPaidAmount = appointment.partialAmount || 0;
  const paymentDelta = Math.max(appointment.amount - previousPaidAmount, 0);

  appointment.payment = true;
  appointment.paymentStatus = 'paid';
  appointment.partialAmount = appointment.amount;
  appointment.paymentMethod = normalizeAppointmentPaymentMethod(paymentMethod);
  appointment.invoiceDate = appointment.invoiceDate || new Date();
  await appointment.save({ session });

  await ensureInvoiceForAppointment(appointment, session);

  if (transactionId) {
    await paymentLogModel.updateOne(
      { transactionId },
      {
        $setOnInsert: {
          appointmentId: appointment._id,
          patientId: appointment.userId,
          amount: paymentDelta || appointment.amount,
          type: 'payment',
          method: normalizePaymentLogMethod(paymentMethod),
          status: 'completed',
          transactionId,
          notes,
          processedBy,
        },
      },
      { upsert: true, session }
    );
  }

  return appointment;
};

const cancelAppointmentRecord = async ({ appointmentId, session }) => {
  const appointment = await appointmentModel.findById(appointmentId).session(session);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.cancelled) {
    return appointment;
  }

  appointment.cancelled = true;
  await appointment.save({ session });

  await releaseDoctorSlot({
    docId: appointment.docId,
    slotDate: appointment.slotDate,
    slotTime: appointment.slotTime,
    session,
  });

  await ensureInvoiceForAppointment(appointment, session, { createIfMissing: false });

  return appointment;
};

const refundAppointmentPayment = async ({
  appointmentId,
  refundAmount,
  reason,
  processedBy = 'system',
  session,
}) => {
  const appointment = await appointmentModel.findById(appointmentId).session(session);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const paidAmount = appointment.partialAmount || (appointment.payment ? appointment.amount : 0);

  if (paidAmount <= 0) {
    throw new Error('Cannot refund an unpaid appointment');
  }

  if (refundAmount > paidAmount) {
    throw new Error('Refund amount cannot exceed the paid amount');
  }

  const remainingPaidAmount = paidAmount - refundAmount;

  appointment.payment = false;
  appointment.partialAmount = remainingPaidAmount;
  appointment.paymentStatus = remainingPaidAmount > 0 ? 'partially paid' : 'refunded';
  appointment.invoiceDate = appointment.invoiceDate || new Date();
  await appointment.save({ session });

  await ensureInvoiceForAppointment(appointment, session);

  await paymentLogModel.create([{
    appointmentId,
    patientId: appointment.userId,
    amount: refundAmount,
    type: 'refund',
    method: normalizePaymentLogMethod(appointment.paymentMethod),
    status: 'completed',
    notes: reason,
    processedBy,
  }], { session });

  return appointment;
};

const isAppointmentSlotConflict = (error) => {
  if (error?.code !== 11000) {
    return false;
  }

  const duplicateKey = error.keyPattern || {};
  return Boolean(duplicateKey.docId && duplicateKey.slotDate && duplicateKey.slotTime);
};

export {
  buildInvoiceItemsFromAppointment,
  cancelAppointmentRecord,
  ensureInvoiceForAppointment,
  ensureInvoiceForAppointmentId,
  finalizeAppointmentPayment,
  getInvoiceStatusForAppointment,
  isAppointmentSlotConflict,
  normalizeAppointmentPaymentMethod,
  normalizePaymentLogMethod,
  refundAppointmentPayment,
  releaseDoctorSlot,
  reserveDoctorSlot,
};
