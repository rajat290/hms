import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';
import StaffBilling from '../StaffBilling';
import { StaffContext } from '../../../context/StaffContext';
import { AppContext } from '../../../context/AppContext';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderStaffBilling = ({
  staffContext = {},
  appContext = {},
} = {}) => {
  const mergedStaffContext = {
    appointments: [],
    updatePayment: vi.fn().mockResolvedValue(undefined),
    ...staffContext,
  };

  const mergedAppContext = {
    slotDateFormat: (value) => value,
    currency: 'INR ',
    ...appContext,
  };

  render(
    <AppContext.Provider value={mergedAppContext}>
      <StaffContext.Provider value={mergedStaffContext}>
        <StaffBilling />
      </StaffContext.Provider>
    </AppContext.Provider>,
  );

  return { mergedStaffContext };
};

describe('StaffBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds an itemized bill and records payment with the computed total', async () => {
    const { mergedStaffContext } = renderStaffBilling({
      staffContext: {
        appointments: [
          {
            _id: 'appointment-1',
            visitStatus: 'accepted',
            paymentStatus: 'unpaid',
            amount: 200,
            slotDate: '2026_4_22',
            slotTime: '09:30',
            userData: { name: 'Priya Das' },
          },
        ],
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /priya das/i }));
    await userEvent.type(screen.getByPlaceholderText(/charge description/i), 'Lab test');
    await userEvent.type(screen.getByPlaceholderText(/charge amount/i), '50');
    await userEvent.click(screen.getByRole('button', { name: /add charge/i }));
    await userEvent.click(screen.getByRole('button', { name: /receive INR 250/i }));

    await waitFor(() => {
      expect(mergedStaffContext.updatePayment).toHaveBeenCalledWith(
        'appointment-1',
        'paid',
        'Cash',
        250,
        [{ name: 'Lab test', cost: 50 }],
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Payment recorded successfully.');
    expect(screen.getByText(/select an appointment to start billing/i)).toBeInTheDocument();
  });
});
