import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Doctor from '../models/doctorModel.js';
import Appointment from '../models/appointmentModel.js';

describe('Model validation tests', () => {
  it('applies expected defaults to a new user', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
    });

    expect(user.isVerified).toBe(false);
    expect(user.twoFactorEnabled).toBe(false);
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
});
