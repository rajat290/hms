import { jest } from '@jest/globals';

const appointmentFindByIdMock = jest.fn();
const doctorUpdateOneMock = jest.fn();
const invoiceFindOneMock = jest.fn();
const invoiceFindByIdAndUpdateMock = jest.fn();
const invoiceFindOneAndUpdateMock = jest.fn();
const paymentLogUpdateOneMock = jest.fn();
const paymentLogCreateMock = jest.fn();

jest.unstable_mockModule('../models/appointmentModel.js', () => ({
  default: {
    findById: appointmentFindByIdMock,
  },
}));

jest.unstable_mockModule('../models/doctorModel.js', () => ({
  default: {
    updateOne: doctorUpdateOneMock,
  },
}));

jest.unstable_mockModule('../models/invoiceModel.js', () => ({
  default: {
    findOne: invoiceFindOneMock,
    findByIdAndUpdate: invoiceFindByIdAndUpdateMock,
    findOneAndUpdate: invoiceFindOneAndUpdateMock,
  },
}));

jest.unstable_mockModule('../models/paymentLogModel.js', () => ({
  default: {
    updateOne: paymentLogUpdateOneMock,
    create: paymentLogCreateMock,
  },
}));

const {
  cancelAppointmentRecord,
  ensureInvoiceForAppointment,
  ensureInvoiceForAppointmentId,
  finalizeAppointmentPayment,
  refundAppointmentPayment,
  releaseDoctorSlot,
  reserveDoctorSlot,
} = await import('../utils/appointmentIntegrity.js');

const createSessionResult = (resolvedValue) => ({
  session: jest.fn().mockResolvedValue(resolvedValue),
});

describe('appointmentIntegrity transactional helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates existing invoices for an appointment when one is already present', async () => {
    invoiceFindOneMock.mockReturnValue(createSessionResult({
      _id: 'inv-1',
      dueDate: new Date(Date.now() + 60 * 60 * 1000),
    }));
    invoiceFindByIdAndUpdateMock.mockResolvedValue({ _id: 'inv-1', status: 'unpaid' });

    const result = await ensureInvoiceForAppointment({
      _id: 'apt-1',
      userId: 'user-1',
      amount: 900,
      paymentStatus: 'unpaid',
      cancelled: false,
      docData: { name: 'Dr. Mehta', speciality: 'Cardiology' },
      billingItems: [],
    }, 'db-session');

    expect(invoiceFindByIdAndUpdateMock).toHaveBeenCalledWith(
      'inv-1',
      expect.objectContaining({
        $set: expect.objectContaining({
          appointmentId: 'apt-1',
          patientId: 'user-1',
          totalAmount: 900,
          status: 'unpaid',
        }),
      }),
      { new: true, session: 'db-session' }
    );
    expect(result).toEqual({ _id: 'inv-1', status: 'unpaid' });
  });

  it('creates invoices when none exist and can load appointments by id first', async () => {
    const appointment = {
      _id: 'apt-2',
      userId: 'user-2',
      amount: 1200,
      paymentStatus: 'paid',
      cancelled: false,
      docData: { name: 'Dr. Sen', speciality: 'Dermatology' },
      billingItems: [],
    };

    appointmentFindByIdMock.mockReturnValueOnce(createSessionResult(appointment));
    invoiceFindOneMock.mockReturnValue(createSessionResult(null));
    invoiceFindOneAndUpdateMock.mockResolvedValue({ _id: 'inv-2', status: 'paid' });

    const result = await ensureInvoiceForAppointmentId('apt-2', 'db-session');

    expect(invoiceFindOneAndUpdateMock).toHaveBeenCalledWith(
      { appointmentId: 'apt-2' },
      expect.objectContaining({
        $set: expect.objectContaining({
          totalAmount: 1200,
          status: 'paid',
        }),
        $setOnInsert: expect.objectContaining({
          invoiceNumber: expect.stringMatching(/^INV-/),
        }),
      }),
      expect.objectContaining({
        upsert: true,
        new: true,
        session: 'db-session',
      })
    );
    expect(result).toEqual({ _id: 'inv-2', status: 'paid' });
  });

  it('throws when ensureInvoiceForAppointmentId is asked for a missing appointment', async () => {
    appointmentFindByIdMock.mockReturnValueOnce(createSessionResult(null));

    await expect(ensureInvoiceForAppointmentId('missing-apt', 'db-session')).rejects.toThrow('Appointment not found');
  });

  it('reserves and releases doctor slots through the doctor model', async () => {
    doctorUpdateOneMock.mockResolvedValue({ modifiedCount: 1 });

    await reserveDoctorSlot({
      docId: 'doctor-1',
      slotDate: '10_04_2026',
      slotTime: '10:30',
      session: 'db-session',
    });
    await releaseDoctorSlot({
      docId: 'doctor-1',
      slotDate: '10_04_2026',
      slotTime: '10:30',
      session: 'db-session',
    });

    expect(doctorUpdateOneMock).toHaveBeenNthCalledWith(
      1,
      { _id: 'doctor-1' },
      { $addToSet: { 'slots_booked.10_04_2026': '10:30' } },
      { session: 'db-session' }
    );
    expect(doctorUpdateOneMock).toHaveBeenNthCalledWith(
      2,
      { _id: 'doctor-1' },
      { $pull: { 'slots_booked.10_04_2026': '10:30' } },
      { session: 'db-session' }
    );
  });

  it('finalizes appointment payments, syncs invoices, and writes idempotent payment logs', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const appointment = {
      _id: 'apt-3',
      userId: 'user-3',
      amount: 1500,
      partialAmount: 300,
      payment: false,
      paymentStatus: 'partially paid',
      paymentMethod: 'Cash',
      cancelled: false,
      docData: { name: 'Dr. Kapoor', speciality: 'General' },
      billingItems: [],
      save: saveMock,
    };

    appointmentFindByIdMock.mockReturnValue(createSessionResult(appointment));
    invoiceFindOneMock.mockReturnValue(createSessionResult(null));
    invoiceFindOneAndUpdateMock.mockResolvedValue({ _id: 'inv-3', status: 'paid' });
    paymentLogUpdateOneMock.mockResolvedValue({ acknowledged: true });

    const result = await finalizeAppointmentPayment({
      appointmentId: 'apt-3',
      transactionId: 'txn-123',
      paymentMethod: 'UPI',
      notes: 'Settled online',
      processedBy: 'test-suite',
      session: 'db-session',
    });

    expect(saveMock).toHaveBeenCalledWith({ session: 'db-session' });
    expect(appointment.payment).toBe(true);
    expect(appointment.paymentStatus).toBe('paid');
    expect(appointment.partialAmount).toBe(1500);
    expect(appointment.paymentMethod).toBe('UPI');
    expect(paymentLogUpdateOneMock).toHaveBeenCalledWith(
      { transactionId: 'txn-123' },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          appointmentId: 'apt-3',
          patientId: 'user-3',
          amount: 1200,
          type: 'payment',
          method: 'online',
          notes: 'Settled online',
          processedBy: 'test-suite',
        }),
      }),
      { upsert: true, session: 'db-session' }
    );
    expect(result).toBe(appointment);
  });

  it('cancels appointments, releases slots, and avoids creating invoices when none exist', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const appointment = {
      _id: 'apt-4',
      docId: 'doctor-4',
      slotDate: '11_04_2026',
      slotTime: '09:00',
      cancelled: false,
      paymentStatus: 'unpaid',
      amount: 800,
      userId: 'user-4',
      docData: { name: 'Dr. Paul', speciality: 'General' },
      billingItems: [],
      save: saveMock,
    };

    appointmentFindByIdMock.mockReturnValue(createSessionResult(appointment));
    doctorUpdateOneMock.mockResolvedValue({ modifiedCount: 1 });
    invoiceFindOneMock.mockReturnValue(createSessionResult(null));

    const result = await cancelAppointmentRecord({
      appointmentId: 'apt-4',
      session: 'db-session',
    });

    expect(appointment.cancelled).toBe(true);
    expect(saveMock).toHaveBeenCalledWith({ session: 'db-session' });
    expect(doctorUpdateOneMock).toHaveBeenCalledWith(
      { _id: 'doctor-4' },
      { $pull: { 'slots_booked.11_04_2026': '09:00' } },
      { session: 'db-session' }
    );
    expect(invoiceFindOneAndUpdateMock).not.toHaveBeenCalled();
    expect(result).toBe(appointment);
  });

  it('refunds paid appointments and logs the refund transaction', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const appointment = {
      _id: 'apt-5',
      userId: 'user-5',
      amount: 900,
      partialAmount: 900,
      payment: true,
      paymentStatus: 'paid',
      paymentMethod: 'Card',
      cancelled: false,
      docData: { name: 'Dr. Rao', speciality: 'General' },
      billingItems: [],
      save: saveMock,
    };

    appointmentFindByIdMock.mockReturnValue(createSessionResult(appointment));
    invoiceFindOneMock.mockReturnValue(createSessionResult(null));
    invoiceFindOneAndUpdateMock.mockResolvedValue({ _id: 'inv-5', status: 'refunded' });
    paymentLogCreateMock.mockResolvedValue([{ _id: 'refund-log-1' }]);

    const result = await refundAppointmentPayment({
      appointmentId: 'apt-5',
      refundAmount: 900,
      reason: 'Doctor unavailable',
      processedBy: 'test-suite',
      session: 'db-session',
    });

    expect(appointment.payment).toBe(false);
    expect(appointment.partialAmount).toBe(0);
    expect(appointment.paymentStatus).toBe('refunded');
    expect(saveMock).toHaveBeenCalledWith({ session: 'db-session' });
    expect(paymentLogCreateMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          appointmentId: 'apt-5',
          patientId: 'user-5',
          amount: 900,
          type: 'refund',
          method: 'card',
          notes: 'Doctor unavailable',
          processedBy: 'test-suite',
        }),
      ],
      { session: 'db-session' }
    );
    expect(result).toBe(appointment);
  });
});
