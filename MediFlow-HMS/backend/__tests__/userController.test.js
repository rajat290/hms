import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import userRoute from '../routes/userRoute.js';
import User from '../models/userModel.js';

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test_hms';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/user', userRoute);

describe('User Controller Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/user/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully. Please check your email for verification.');
    });

    it('should return error for missing required fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
        // Missing password and phone
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for duplicate email', async () => {
      // First register a user
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        isVerified: false
      });

      const userData = {
        name: 'Jane Doe',
        email: 'john@example.com', // Same email
        password: 'password123',
        phone: '+0987654321'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/user/verify-email', () => {
    it('should verify email with valid token', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        verificationToken: 'valid_token',
        isVerified: false
      });

      const response = await request(app)
        .post('/api/user/verify-email')
        .send({ token: 'valid_token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/api/user/verify-email')
        .send({ token: 'invalid_token' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired verification token');
    });
  });

  describe('POST /api/user/forgot-password', () => {
    it('should send reset email for valid user', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        isVerified: true
      });

      const response = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: 'john@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset email sent');
    });

    it('should return error for non-existent email', async () => {
      const response = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/user/reset-password', () => {
    it('should reset password with valid token', async () => {
      const resetToken = 'valid_reset_token';
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
        isVerified: true
      });

      const response = await request(app)
        .post('/api/user/reset-password')
        .send({ token: resetToken, newPassword: 'newpassword123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successfully');
    });

    it('should return error for expired token', async () => {
      const resetToken = 'expired_token';
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        phone: '+1234567890',
        resetToken,
        resetTokenExpiry: new Date(Date.now() - 3600000), // 1 hour ago
        isVerified: true
      });

      const response = await request(app)
        .post('/api/user/reset-password')
        .send({ token: resetToken, newPassword: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });
  });
});
