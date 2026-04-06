import express from 'express';
import request from 'supertest';
import { createLimiter } from '../middleware/rateLimiters.js';
import sanitizeRequestInput from '../middleware/requestSanitizer.js';
import { validateLogin, validateUserProfileUpdate } from '../middleware/validators.js';

const runMiddleware = async (middleware, reqOverrides = {}) => {
  const req = {
    body: {},
    query: {},
    params: {},
    ...reqOverrides,
  };

  let statusCode = 200;
  let payload;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return data;
    },
  };

  await new Promise((resolve) => {
    middleware(req, res, () => {
      nextCalled = true;
      resolve();
    });

    if (!nextCalled && payload !== undefined) {
      resolve();
    }
  });

  return { req, statusCode, payload, nextCalled };
};

describe('Security middleware', () => {
  it('sanitizes request body, query, and params values', async () => {
    const result = await runMiddleware(sanitizeRequestInput, {
      body: { name: '  Alice\0  ', nested: { note: '\0 Hello ' } },
      query: { search: '  fever ' },
      params: { userId: ' 123 ' },
    });

    expect(result.nextCalled).toBe(true);
    expect(result.req.body.name).toBe('Alice');
    expect(result.req.body.nested.note).toBe('Hello');
    expect(result.req.query.search).toBe('fever');
    expect(result.req.params.userId).toBe('123');
  });

  it('rejects invalid login payloads with a consistent 400 response', async () => {
    const result = await runMiddleware(validateLogin, {
      body: { email: 'not-an-email', password: 'secret123' },
    });

    expect(result.nextCalled).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.payload).toEqual({
      success: false,
      message: 'email must be a valid email',
    });
  });

  it('accepts auth-populated profile updates when optional fields are well formed', async () => {
    const result = await runMiddleware(validateUserProfileUpdate, {
      body: {
        userId: '507f1f77bcf86cd799439011',
        name: 'Alicia',
        address: { city: 'Kolkata' },
        emergencyContact: JSON.stringify({ name: 'Bob', phone: '9999999999' }),
      },
    });

    expect(result.nextCalled).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('skips rate limiting for health checks while protecting other routes', async () => {
    const app = express();
    app.use(
      createLimiter({
        windowMs: 60 * 1000,
        limit: 1,
        message: 'Too many requests. Please try again later.',
        skip: (req) => req.path === '/health',
      }),
    );
    app.get('/health', (req, res) => res.json({ success: true }));
    app.get('/secure', (req, res) => res.json({ success: true }));

    const healthOne = await request(app).get('/health');
    const healthTwo = await request(app).get('/health');
    const secureOne = await request(app).get('/secure');
    const secureTwo = await request(app).get('/secure');

    expect(healthOne.status).toBe(200);
    expect(healthTwo.status).toBe(200);
    expect(secureOne.status).toBe(200);
    expect(secureTwo.status).toBe(429);
    expect(secureTwo.body).toEqual({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  });
});
