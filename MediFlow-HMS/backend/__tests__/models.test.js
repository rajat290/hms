import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Doctor from '../models/doctorModel.js';
import Appointment from '../models/appointmentModel.js';
import AuthSession from '../models/authSessionModel.js';
import Invoice from '../models/invoiceModel.js';
import PaymentLog from '../models/paymentLogModel.js';

describe('Model validation tests', () => {
  it('applies expected defaults to a new user', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
    });

    expect(user.isVerified).toBe(false);
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.twoFactorCode).toBeUndefined();
    expect(user.patientCategory).toBe('Standard');
  });

  it('applies expected defaults to a new doctor', () => {
    const doctor = new Doctor({
      name: 'Dr. Smith',
      email: 'smith@example.com',
      password: 'hashed-password',
      image: 'https://example.com/doctor.jpg',
      speciality: 'Cardiology',
      degree: 'MD',
      experience: '5 Years',
      about: 'Experienced cardiologist',
      fees: 500,
      address: { line1: '123 Main Street', line2: 'Kolkata' },
      date: Date.now(),
    });

    expect(doctor.available).toBe(true);
    expect(doctor.availability.enabled).toBe(true);
    expect(doctor.paymentMethods.cash).toBe(true);
    expect(doctor.paymentMethods.online).toBe(true);
  });

  it('accepts refunded payment status and rejects invalid statuses', () => {
    const appointment = new Appointment({
      userId: new mongoose.Types.ObjectId(),
      docId: new mongoose.Types.ObjectId(),
      userData: { name: 'John Doe' },
      docData: { name: 'Dr. Smith' },
      amount: 500,
      slotTime: '10:00',
      slotDate: '10_4_2026',
      date: Date.now(),
      paymentStatus: 'refunded',
    });

    expect(appointment.validateSync()).toBeUndefined();

    appointment.paymentStatus = 'invalid-status';
    const error = appointment.validateSync();

    expect(error.errors.paymentStatus).toBeDefined();
  });

  it('registers the active-slot unique index for appointments', () => {
    const indexes = Appointment.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { docId: 1, slotDate: 1, slotTime: 1 },
          expect.objectContaining({
            unique: true,
            partialFilterExpression: { cancelled: false },
          }),
        ],
      ])
    );
  });

  it('locks invoices to one appointment and supports refunded and partially paid statuses', () => {
    const indexes = Invoice.schema.indexes();
    const statusEnum = Invoice.schema.path('status').enumValues;

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { appointmentId: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ])
    );

    expect(statusEnum).toEqual(
      expect.arrayContaining(['paid', 'unpaid', 'overdue', 'cancelled', 'partially paid', 'refunded'])
    );
  });

  it('deduplicates payment logs by external transaction id', () => {
    const indexes = PaymentLog.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { transactionId: 1 },
          expect.objectContaining({ unique: true, sparse: true }),
        ],
      ])
    );
  });

  it('registers refresh-session persistence and expiry indexes', () => {
    const indexes = AuthSession.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { sessionId: 1 },
          expect.objectContaining({ unique: true }),
        ],
        [
          { expiresAt: 1 },
          expect.objectContaining({ expireAfterSeconds: 0 }),
        ],
      ])
    );
  });
});
