import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Doctor from '../models/doctorModel.js';
import Appointment from '../models/appointmentModel.js';
import MedicalRecord from '../models/medicalRecordModel.js';
import Prescription from '../models/prescriptionModel.js';
import Message from '../models/messageModel.js';

// Mock environment variables
process.env.MONGO_URI = 'mongodb://localhost:27017/test_hms';

describe('Model Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Prescription.deleteMany({});
    await Message.deleteMany({});
  });

  describe('User Model', () => {
    it('should create a user with new auth fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        isVerified: false,
        verificationToken: 'test_token',
        resetToken: 'reset_token',
        resetTokenExpiry: new Date(Date.now() + 3600000),
        twoFactorEnabled: false
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.isVerified).toBe(false);
      expect(savedUser.verificationToken).toBe('test_token');
      expect(savedUser.twoFactorEnabled).toBe(false);
    });

    it('should validate required fields', async () => {
      const user = new User({}); // Empty user

      let error;
      try {
        await user.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });
  });

  describe('Doctor Model', () => {
    it('should create a doctor with new auth fields', async () => {
      const doctorData = {
        name: 'Dr. Smith',
        email: 'smith@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        speciality: 'Cardiology',
        degree: 'MD',
        experience: '5 years',
        about: 'Experienced cardiologist',
        fees: 500,
        address: { line1: '123 Main St', line2: 'City, State' },
        isVerified: false,
        verificationToken: 'doc_token',
        resetToken: 'doc_reset_token',
        resetTokenExpiry: new Date(Date.now() + 3600000),
        twoFactorEnabled: false
      };

      const doctor = new Doctor(doctorData);
      const savedDoctor = await doctor.save();

      expect(savedDoctor.name).toBe(doctorData.name);
      expect(savedDoctor.speciality).toBe(doctorData.speciality);
      expect(savedDoctor.isVerified).toBe(false);
      expect(savedDoctor.twoFactorEnabled).toBe(false);
    });
  });

  describe('MedicalRecord Model', () => {
    it('should create a medical record', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        isVerified: true
      });

      const recordData = {
        userId: user._id,
        medicalHistory: ['Hypertension diagnosed in 2020'],
        allergies: ['Penicillin'],
        medications: ['Lisinopril 10mg daily'],
        notes: 'Patient reports occasional headaches'
      };

      const record = new MedicalRecord(recordData);
      const savedRecord = await record.save();

      expect(savedRecord.userId.toString()).toBe(user._id.toString());
      expect(savedRecord.medicalHistory).toContain('Hypertension diagnosed in 2020');
      expect(savedRecord.allergies).toContain('Penicillin');
    });
  });

  describe('Prescription Model', () => {
    it('should create a prescription', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        isVerified: true
      });

      const doctor = await Doctor.create({
        name: 'Dr. Smith',
        email: 'smith@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        speciality: 'Cardiology',
        degree: 'MD',
        experience: '5 years',
        about: 'Experienced cardiologist',
        fees: 500,
        address: { line1: '123 Main St', line2: 'City, State' },
        isVerified: true
      });

      const prescriptionData = {
        userId: user._id,
        doctorId: doctor._id,
        medications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '30 days'
          }
        ],
        instructions: 'Take with food',
        dateIssued: new Date()
      };

      const prescription = new Prescription(prescriptionData);
      const savedPrescription = await prescription.save();

      expect(savedPrescription.userId.toString()).toBe(user._id.toString());
      expect(savedPrescription.doctorId.toString()).toBe(doctor._id.toString());
      expect(savedPrescription.medications[0].name).toBe('Lisinopril');
    });
  });

  describe('Message Model', () => {
    it('should create a message', async () => {
      const sender = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        isVerified: true
      });

      const receiver = await Doctor.create({
        name: 'Dr. Smith',
        email: 'smith@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        speciality: 'Cardiology',
        degree: 'MD',
        experience: '5 years',
        about: 'Experienced cardiologist',
        fees: 500,
        address: { line1: '123 Main St', line2: 'City, State' },
        isVerified: true
      });

      const messageData = {
        senderId: sender._id,
        receiverId: receiver._id,
        senderModel: 'User',
        receiverModel: 'Doctor',
        content: 'Hello doctor, I have a question about my prescription.',
        timestamp: new Date(),
        isRead: false
      };

      const message = new Message(messageData);
      const savedMessage = await message.save();

      expect(savedMessage.senderId.toString()).toBe(sender._id.toString());
      expect(savedMessage.receiverId.toString()).toBe(receiver._id.toString());
      expect(savedMessage.content).toBe('Hello doctor, I have a question about my prescription.');
      expect(savedMessage.isRead).toBe(false);
    });
  });

  describe('Appointment Model Enhancements', () => {
    it('should create appointment with consultation notes and follow-up', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        isVerified: true
      });

      const doctor = await Doctor.create({
        name: 'Dr. Smith',
        email: 'smith@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        speciality: 'Cardiology',
        degree: 'MD',
        experience: '5 years',
        about: 'Experienced cardiologist',
        fees: 500,
        address: { line1: '123 Main St', line2: 'City, State' },
        isVerified: true
      });

      const appointmentData = {
        userId: user._id,
        doctorId: doctor._id,
        slotDate: '2024-12-01',
        slotTime: '10:00',
        userData: { name: 'John Doe', phone: '+1234567890' },
        doctorData: { name: 'Dr. Smith', speciality: 'Cardiology' },
        amount: 500,
        date: Date.now(),
        cancelled: false,
        payment: false,
        isCompleted: false,
        consultationNotes: 'Patient presented with chest pain. ECG normal.',
        followUpRequired: true,
        followUpDate: '2024-12-15'
      };

      const appointment = new Appointment(appointmentData);
      const savedAppointment = await appointment.save();

      expect(savedAppointment.consultationNotes).toBe('Patient presented with chest pain. ECG normal.');
      expect(savedAppointment.followUpRequired).toBe(true);
      expect(savedAppointment.followUpDate).toBe('2024-12-15');
    });
  });
});
