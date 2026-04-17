import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { StaffContext } from '../../../context/StaffContext';
import { AppContext } from '../../../context/AppContext';
import StaffAppointments from '../StaffAppointments';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderStaffAppointments = ({
  staffContext = {},
  appContext = {},
} = {}) => {
  const mergedStaffContext = {
    sToken: 'staff-token',
    appointments: [],
    cancelAppointment: vi.fn(),
    getAllAppointments: vi.fn(),
    checkInAppointment: vi.fn(),
    ...staffContext,
  };

  const mergedAppContext = {
    slotDateFormat: (value) => value,
    calculateAge: () => 31,
    currency: 'INR ',
    ...appContext,
  };

  render(
    <MemoryRouter>
      <AppContext.Provider value={mergedAppContext}>
        <StaffContext.Provider value={mergedStaffContext}>
          <StaffAppointments />
        </StaffContext.Provider>
      </AppContext.Provider>
    </MemoryRouter>,
  );

  return { mergedStaffContext };
};

describe('StaffAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads appointments and routes actionable visits into billing or check-in', async () => {
    const { mergedStaffContext } = renderStaffAppointments({
      staffContext: {
        appointments: [
          {
            _id: 'appointment-1',
            visitStatus: 'requested',
            paymentStatus: 'unpaid',
            amount: 400,
            slotDate: '2026_4_20',
            slotTime: '10:00',
            userData: { name: 'Alice Patient', dob: '1993-01-10', image: '/alice.png' },
            docData: { name: 'Dr. Sen', speciality: 'Cardiology' },
          },
          {
            _id: 'appointment-2',
            visitStatus: 'completed',
            paymentStatus: 'paid',
            amount: 250,
            slotDate: '2026_4_21',
            slotTime: '15:00',
            userData: { name: 'Completed Patient', dob: '1989-02-04', image: '/done.png' },
            docData: { name: 'Dr. Shah', speciality: 'Dermatology' },
          },
        ],
      },
    });

    await waitFor(() => {
      expect(mergedStaffContext.getAllAppointments).toHaveBeenCalled();
    });

    await userEvent.click(screen.getAllByRole('button', { name: /^billing$/i })[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/staff-billing');

    await userEvent.click(screen.getByRole('button', { name: /check in/i }));
    expect(mergedStaffContext.checkInAppointment).toHaveBeenCalledWith('appointment-1');

    const searchInput = screen.getByPlaceholderText(/search patient, doctor, or date/i);
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'Completed Patient');

    expect(screen.getByRole('button', { name: /^billing$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /check in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });
});
