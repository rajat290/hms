import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { jest } from '@jest/globals';

process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.RAZORPAY_WEBHOOK_SECRET = 'rzp_webhook_secret';

const finalizeAppointmentPaymentMock = jest.fn();
const runInTransactionMock = jest.fn();
const constructEventMock = jest.fn();

const stripeConstructorMock = jest.fn(() => ({
  webhooks: {
    constructEvent: constructEventMock,
  },
}));

jest.unstable_mockModule('../utils/appointmentIntegrity.js', () => ({
  finalizeAppointmentPayment: finalizeAppointmentPaymentMock,
}));

jest.unstable_mockModule('../utils/transaction.js', () => ({
  runInTransaction: runInTransactionMock,
}));

jest.unstable_mockModule('stripe', () => ({
  default: stripeConstructorMock,
}));

const { default: paymentRouter } = await import('../routes/paymentRoute.js');

const createApp = () => {
  const app = express();
  app.use('/api/payment', paymentRouter);
  return app;
};

describe('paymentRoute webhooks', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    runInTransactionMock.mockImplementation(async (callback) => callback('db-session'));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('accepts valid Razorpay webhook payloads and finalizes the appointment payment', async () => {
    const app = createApp();
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            receipt: 'apt-1',
            notes: {
              appointmentId: 'apt-1',
            },
          },
        },
      },
    };

    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await request(app)
      .post('/api/payment/razorpay-webhook')
      .set('x-razorpay-signature', signature)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.text).toBe('Webhook received');
    expect(finalizeAppointmentPaymentMock).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      transactionId: 'pay_123',
      paymentMethod: 'Online',
      notes: 'Captured from Razorpay webhook',
      processedBy: 'razorpay-webhook',
      session: 'db-session',
    });
  });

  it('accepts valid Stripe checkout webhooks and finalizes the appointment payment', async () => {
    const app = createApp();
    constructEventMock.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          payment_intent: 'pi_123',
          client_reference_id: 'apt-1',
          metadata: {
            appointmentId: 'apt-1',
          },
        },
      },
    });

    const response = await request(app)
      .post('/api/payment/stripe-webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'sig_test')
      .send('{"id":"evt_123"}');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
    expect(constructEventMock).toHaveBeenCalled();
    expect(finalizeAppointmentPaymentMock).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      transactionId: 'pi_123',
      paymentMethod: 'Online',
      notes: 'Completed from Stripe webhook',
      processedBy: 'stripe-webhook',
      session: 'db-session',
    });
  });

  it('rejects Stripe webhook requests when signature verification fails', async () => {
    const app = createApp();
    constructEventMock.mockImplementation(() => {
      throw new Error('bad stripe signature');
    });

    const response = await request(app)
      .post('/api/payment/stripe-webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'sig_test')
      .send('{"id":"evt_123"}');

    expect(response.status).toBe(400);
    expect(response.text).toContain('Webhook Error: bad stripe signature');
    expect(finalizeAppointmentPaymentMock).not.toHaveBeenCalled();
  });
});
