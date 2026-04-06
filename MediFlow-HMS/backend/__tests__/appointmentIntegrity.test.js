import {
  buildInvoiceItemsFromAppointment,
  getInvoiceStatusForAppointment,
  isAppointmentSlotConflict,
  normalizeAppointmentPaymentMethod,
  normalizePaymentLogMethod,
} from '../utils/appointmentIntegrity.js';

describe('appointmentIntegrity helpers', () => {
  it('maps appointment payment state to invoice state', () => {
    expect(getInvoiceStatusForAppointment({ paymentStatus: 'paid', cancelled: false })).toBe('paid');
    expect(getInvoiceStatusForAppointment({ paymentStatus: 'partially paid', cancelled: false })).toBe('partially paid');
    expect(getInvoiceStatusForAppointment({ paymentStatus: 'refunded', cancelled: false })).toBe('refunded');
    expect(getInvoiceStatusForAppointment({ paymentStatus: 'unpaid', cancelled: true })).toBe('cancelled');
    expect(getInvoiceStatusForAppointment({ paymentStatus: 'unpaid', cancelled: false })).toBe('unpaid');
  });

  it('builds invoice items from explicit billing rows when present', () => {
    const items = buildInvoiceItemsFromAppointment({
      billingItems: [
        { name: 'Consultation', cost: 600 },
        { name: 'Scan', cost: 1200 },
      ],
      docData: { name: 'Dr. Mehta', speciality: 'Cardiology' },
      amount: 1800,
    });

    expect(items).toEqual([
      { description: 'Consultation', quantity: 1, unitPrice: 600, total: 600 },
      { description: 'Scan', quantity: 1, unitPrice: 1200, total: 1200 },
    ]);
  });

  it('falls back to consultation invoice items when billing rows are absent', () => {
    const items = buildInvoiceItemsFromAppointment({
      billingItems: [],
      docData: { name: 'Dr. Mehta', speciality: 'Cardiology' },
      amount: 900,
    });

    expect(items).toEqual([
      {
        description: 'Consultation with Dr. Mehta (Cardiology)',
        quantity: 1,
        unitPrice: 900,
        total: 900,
      },
    ]);
  });

  it('normalizes payment methods for appointments and payment logs', () => {
    expect(normalizeAppointmentPaymentMethod('cash')).toBe('Cash');
    expect(normalizeAppointmentPaymentMethod('upi')).toBe('UPI');
    expect(normalizeAppointmentPaymentMethod('something-else')).toBe('N/A');

    expect(normalizePaymentLogMethod('card')).toBe('card');
    expect(normalizePaymentLogMethod('upi')).toBe('online');
    expect(normalizePaymentLogMethod('unknown')).toBe('cash');
  });

  it('detects duplicate active-slot errors coming from the appointment uniqueness index', () => {
    expect(isAppointmentSlotConflict({
      code: 11000,
      keyPattern: { docId: 1, slotDate: 1, slotTime: 1 },
    })).toBe(true);

    expect(isAppointmentSlotConflict({
      code: 11000,
      keyPattern: { invoiceNumber: 1 },
    })).toBe(false);
  });
});
