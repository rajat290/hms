import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.RAZORPAY_KEY_ID = 'rzp_test_fake';
process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_fake';
process.env.CURRENCY = 'INR';

const doctorFindByIdMock = jest.fn();
const userFindByIdMock = jest.fn();
const appointmentFindOneMock = jest.fn();
const appointmentCreateMock = jest.fn();
const appointmentFindByIdMock = jest.fn();
const notificationCreateMock = jest.fn();
const cancelAppointmentRecordMock = jest.fn();
const reserveDoctorSlotMock = jest.fn();
const finalizeAppointmentPaymentMock = jest.fn();
const runInTransactionMock = jest.fn();
const stripeRetrieveMock = jest.fn();
const razorpayFetchMock = jest.fn();

const stripeConstructorMock = jest.fn(() => ({
  checkout: {
    sessions: {
      retrieve: stripeRetrieveMock,
      create: jest.fn(),
    },
  },
}));

const razorpayConstructorMock = jest.fn(() => ({
  orders: {
    fetch: razorpayFetchMock,
    create: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/doctorModel.js', () => ({
  default: { findById: doctorFindByIdMock },
}));

jest.unstable_mockModule('../models/userModel.js', () => ({
  default: { findById: userFindByIdMock },
}));

jest.unstable_mockModule('../models/appointmentModel.js', () => ({
  default: {
    findOne: appointmentFindOneMock,
    create: appointmentCreateMock,
    findById: appointmentFindByIdMock,
  },
}));

jest.unstable_mockModule('../models/notificationModel.js', () => ({
  default: { create: notificationCreateMock },
}));

jest.unstable_mockModule('../models/settingsModel.js', () => ({
  default: {},
}));

jest.unstable_mockModule('../models/prescriptionModel.js', () => ({
  default: {},
}));

jest.unstable_mockModule('cloudinary', () => ({
  v2: { uploader: { upload: jest.fn() } },
}));

jest.unstable_mockModule('../utils/slotGenerator.js', () => ({
  generateAvailableSlots: jest.fn(),
}));

jest.unstable_mockModule('../utils/appointmentIntegrity.js', () => ({
  cancelAppointmentRecord: cancelAppointmentRecordMock,
  ensureInvoiceForAppointment: jest.fn(),
  finalizeAppointmentPayment: finalizeAppointmentPaymentMock,
  isAppointmentSlotConflict: (error) => Boolean(
    error?.code === 11000
      && error?.keyPattern?.docId
      && error?.keyPattern?.slotDate
      && error?.keyPattern?.slotTime
  ),
  releaseDoctorSlot: jest.fn(),
  reserveDoctorSlot: reserveDoctorSlotMock,
}));

jest.unstable_mockModule('../utils/transaction.js', () => ({
  runInTransaction: runInTransactionMock,
}));

jest.unstable_mockModule('stripe', () => ({
  default: stripeConstructorMock,
}));

jest.unstable_mockModule('razorpay', () => ({
  default: razorpayConstructorMock,
}));

jest.unstable_mockModule('../services/auth/userAuthService.js', () => ({
  enableUserTwoFactor: jest.fn(),
  loginUserAccount: jest.fn(),
  registerUserAccount: jest.fn(),
  requestUserPasswordReset: jest.fn(),
  resetUserPassword: jest.fn(),
  verifyUserPasswordResetOtp: jest.fn(),
  verifyUserEmail: jest.fn(),
  verifyUserTwoFactor: jest.fn(),
}));

const { bookAppointment, verifyRazorpay, verifyStripe } = await import('../controllers/userController.js');

const createResponse = () => ({
  json: jest.fn(),
});

const createSessionBoundResult = (resolvedValue) => ({
  session: jest.fn().mockResolvedValue(resolvedValue),
});

describe('userController booking and payment flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runInTransactionMock.mockImplementation(async (callback) => callback('db-session'));
  });

  it('books an appointment and reserves the doctor slot inside the transaction flow', async () => {
    const doctorData = {
      _id: 'doctor-1',
      name: 'Dr. Mehta',
      speciality: 'Cardiology',
      available: true,
      fees: 900,
      paymentMethods: { online: true },
      toObject: () => ({
        _id: 'doctor-1',
        name: 'Dr. Mehta',
        speciality: 'Cardiology',
        available: true,
        fees: 900,
        paymentMethods: { online: true },
        slots_booked: { '10_04_2026': ['10:00'] },
      }),
    };
    const userData = {
      _id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      toObject: () => ({
        _id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
      }),
    };

    doctorFindByIdMock.mockReturnValue({
      select: jest.fn(() => createSessionBoundResult(doctorData)),
    });
    appointmentFindOneMock.mockReturnValue(createSessionBoundResult(null));
    userFindByIdMock.mockReturnValue({
      select: jest.fn(() => createSessionBoundResult(userData)),
    });
    appointmentCreateMock.mockResolvedValue([{ _id: 'apt-1' }]);
    notificationCreateMock.mockResolvedValue([]);

    const res = createResponse();

    await bookAppointment({
      body: {
        userId: 'user-1',
        docId: 'doctor-1',
        slotDate: '10_04_2026',
        slotTime: '11:00',
        patientInfo: { symptoms: 'Chest pain' },
        paymentMethod: 'Online',
      },
    }, res);

    expect(appointmentCreateMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          userId: 'user-1',
          docId: 'doctor-1',
          amount: 900,
          slotDate: '10_04_2026',
          slotTime: '11:00',
          paymentMethod: 'Online',
          patientInfo: { symptoms: 'Chest pain' },
        }),
      ],
      { session: 'db-session', ordered: true }
    );
    expect(reserveDoctorSlotMock).toHaveBeenCalledWith({
      docId: 'doctor-1',
      slotDate: '10_04_2026',
      slotTime: '11:00',
      session: 'db-session',
    });
    expect(notificationCreateMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'user-1', title: 'Appointment Booked' }),
        expect.objectContaining({ recipientType: 'staff', title: 'New Appointment Booked' }),
      ]),
      { session: 'db-session', ordered: true }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Appointment Booked',
      appointmentId: 'apt-1',
    });
  });

  it('returns the slot conflict message when the transaction reports a duplicate active slot', async () => {
    runInTransactionMock.mockRejectedValueOnce({
      code: 11000,
      keyPattern: { docId: 1, slotDate: 1, slotTime: 1 },
    });

    const res = createResponse();

    await bookAppointment({
      body: {
        userId: 'user-1',
        docId: 'doctor-1',
        slotDate: '10_04_2026',
        slotTime: '11:00',
      },
    }, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Slot Not Available',
    });
  });

  it('verifies a Razorpay payment and finalizes the appointment when the signature is valid', async () => {
    const crypto = await import('crypto');
    const orderId = 'order_123';
    const paymentId = 'pay_123';
    const signature = crypto.default
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    razorpayFetchMock.mockResolvedValue({
      receipt: 'apt-1',
      status: 'paid',
    });
    appointmentFindByIdMock.mockResolvedValue({
      _id: 'apt-1',
      userId: { toString: () => 'user-1' },
    });

    const res = createResponse();

    await verifyRazorpay({
      body: {
        userId: 'user-1',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    }, res);

    expect(finalizeAppointmentPaymentMock).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      transactionId: paymentId,
      paymentMethod: 'Online',
      notes: 'Verified via Razorpay callback',
      processedBy: 'razorpay-verification',
      session: 'db-session',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Payment Successful',
    });
  });

  it('verifies a Stripe session and finalizes the appointment when the checkout session is paid', async () => {
    appointmentFindByIdMock.mockResolvedValue({
      _id: 'apt-1',
      userId: { toString: () => 'user-1' },
    });
    stripeRetrieveMock.mockResolvedValue({
      id: 'cs_123',
      payment_intent: 'pi_123',
      client_reference_id: 'apt-1',
      payment_status: 'paid',
    });

    const res = createResponse();

    await verifyStripe({
      body: {
        userId: 'user-1',
        appointmentId: 'apt-1',
        sessionId: 'cs_123',
      },
    }, res);

    expect(stripeRetrieveMock).toHaveBeenCalledWith('cs_123');
    expect(finalizeAppointmentPaymentMock).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      transactionId: 'pi_123',
      paymentMethod: 'Online',
      notes: 'Verified via Stripe checkout session',
      processedBy: 'stripe-verification',
      session: 'db-session',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Payment Successful',
    });
  });
});
