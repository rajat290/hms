import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import notificationRoute from '../routes/notificationRoute.js';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn((mailOptions, callback) => {
      callback(null, { messageId: 'test-message-id' });
    }),
  })),
}));

// Mock twilio
jest.mock('twilio', () => jest.fn(() => ({
  messages: {
    create: jest.fn(() => Promise.resolve({ sid: 'test-sid' })),
  },
})));

const app = express();
app.use(express.json());
app.use('/api/notification', notificationRoute);

describe('Notification Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/notification/send-verification-email', () => {
    it('should send verification email successfully', async () => {
      const emailData = {
        email: 'test@example.com',
        token: 'verification_token_123'
      };

      const response = await request(app)
        .post('/api/notification/send-verification-email')
        .send(emailData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Verification email sent successfully');
    });

    it('should return error for missing email', async () => {
      const emailData = {
        token: 'verification_token_123'
        // Missing email
      };

      const response = await request(app)
        .post('/api/notification/send-verification-email')
        .send(emailData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notification/send-reset-email', () => {
    it('should send password reset email successfully', async () => {
      const emailData = {
        email: 'test@example.com',
        resetToken: 'reset_token_123'
      };

      const response = await request(app)
        .post('/api/notification/send-reset-email')
        .send(emailData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset email sent successfully');
    });
  });

  describe('POST /api/notification/send-appointment-reminder', () => {
    it('should send appointment reminder successfully', async () => {
      const reminderData = {
        email: 'patient@example.com',
        phone: '+1234567890',
        doctorName: 'Dr. Smith',
        appointmentDate: '2024-12-01',
        appointmentTime: '10:00'
      };

      const response = await request(app)
        .post('/api/notification/send-appointment-reminder')
        .send(reminderData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment reminder sent successfully');
    });
  });

  describe('POST /api/notification/send-sms', () => {
    it('should send SMS successfully', async () => {
      const smsData = {
        phone: '+1234567890',
        message: 'Your appointment is confirmed for tomorrow at 10:00 AM'
      };

      const response = await request(app)
        .post('/api/notification/send-sms')
        .send(smsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SMS sent successfully');
    });

    it('should return error for missing phone number', async () => {
      const smsData = {
        message: 'Test message'
        // Missing phone
      };

      const response = await request(app)
        .post('/api/notification/send-sms')
        .send(smsData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
