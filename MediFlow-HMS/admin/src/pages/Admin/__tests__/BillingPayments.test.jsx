import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';
import BillingPayments from '../BillingPayments';
import { AdminContext } from '../../../context/AdminContext';
import { AppContext } from '../../../context/AppContext';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('../../../components/PaymentKPIs', () => ({
  default: () => <div data-testid="payment-kpis" />,
}));
vi.mock('../../../components/PaymentHistoryModal', () => ({
  default: () => <div data-testid="payment-history-modal" />,
}));

const renderBillingPayments = ({
  adminContext = {},
  appContext = {},
} = {}) => {
  const mergedAdminContext = {
    aToken: 'admin-token',
    appointments: [],
    getAllAppointments: vi.fn().mockResolvedValue(undefined),
    backendUrl: 'http://localhost:4000',
    ...adminContext,
  };

  const mergedAppContext = {
    calculateAge: () => 35,
    slotDateFormat: (value) => value,
    currency: 'INR ',
    ...appContext,
  };

  render(
    <AppContext.Provider value={mergedAppContext}>
      <AdminContext.Provider value={mergedAdminContext}>
        <BillingPayments />
      </AdminContext.Provider>
    </AppContext.Provider>,
  );

  return { mergedAdminContext };
};

describe('BillingPayments', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('processes refunds for paid appointments and reloads billing data', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url.includes('/payment-kpis')) {
        return { json: async () => ({ success: true, kpis: {} }) };
      }

      if (url.includes('/all-invoices')) {
        return { json: async () => ({ success: true, invoices: [] }) };
      }

      if (url.includes('/process-refund')) {
        return { json: async () => ({ success: true, message: 'Refund processed' }) };
      }

      throw new Error(`Unexpected fetch request: ${url}`);
    });

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Duplicate payment');
    const { mergedAdminContext } = renderBillingPayments({
      adminContext: {
        appointments: [
          {
            _id: 'appointment-paid',
            paymentStatus: 'paid',
            payment: true,
            amount: 800,
            slotDate: '2026_4_25',
            slotTime: '16:00',
            date: '2026-04-25T10:00:00.000Z',
            userData: { name: 'Refund Patient', dob: '1990-05-10', image: '/refund.png' },
            docData: { name: 'Dr. Roy', speciality: 'General medicine', image: '/doctor.png' },
          },
        ],
      },
    });

    await waitFor(() => {
      expect(mergedAdminContext.getAllAppointments).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByRole('button', { name: /process refund/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/admin/process-refund',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            aToken: 'admin-token',
          }),
          body: JSON.stringify({
            appointmentId: 'appointment-paid',
            refundAmount: 800,
            reason: 'Duplicate payment',
          }),
        }),
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Refund processed');
    expect(mergedAdminContext.getAllAppointments).toHaveBeenCalledTimes(2);
    promptSpy.mockRestore();
  });
});
