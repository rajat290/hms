import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import axios from 'axios';
import { toast } from 'react-toastify';
import DoctorAppointments from '../DoctorAppointments';
import { DoctorContext } from '../../../context/DoctorContext';
import { AppContext } from '../../../context/AppContext';

vi.mock('axios');
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderDoctorAppointments = ({
  doctorContext = {},
  appContext = {},
} = {}) => {
  const mergedDoctorContext = {
    dToken: 'doctor-token',
    appointments: [],
    getAppointments: vi.fn(),
    cancelAppointment: vi.fn(),
    completeAppointment: vi.fn(),
    acceptAppointment: vi.fn(),
    startConsultation: vi.fn(),
    backendUrl: 'http://localhost:4000',
    ...doctorContext,
  };

  const mergedAppContext = {
    slotDateFormat: (value) => value,
    calculateAge: () => 34,
    currency: 'INR ',
    ...appContext,
  };

  render(
    <AppContext.Provider value={mergedAppContext}>
      <DoctorContext.Provider value={mergedDoctorContext}>
        <DoctorAppointments />
      </DoctorContext.Provider>
    </AppContext.Provider>,
  );

  return { mergedDoctorContext };
};

describe('DoctorAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads appointments and routes a requested visit into confirmation', async () => {
    const { mergedDoctorContext } = renderDoctorAppointments({
      doctorContext: {
        appointments: [
          {
            _id: 'appointment-1',
            visitStatus: 'requested',
            paymentStatus: 'unpaid',
            amount: 500,
            slotDate: '2026_4_23',
            slotTime: '11:00',
            userData: { name: 'Rohan Patient', dob: '1992-03-10', image: '/rohan.png' },
            docData: { name: 'Dr. Banerjee', speciality: 'General medicine' },
          },
        ],
      },
    });

    await waitFor(() => {
      expect(mergedDoctorContext.getAppointments).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(mergedDoctorContext.acceptAppointment).toHaveBeenCalledWith('appointment-1');
  });

  it('adds a note and submits a prescription for the active appointment', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Monitor blood pressure');
    axios.post
      .mockResolvedValueOnce({ data: { success: true } })
      .mockResolvedValueOnce({ data: { success: true, message: 'Prescription generated' } });

    renderDoctorAppointments({
      doctorContext: {
        appointments: [
          {
            _id: 'appointment-9',
            visitStatus: 'accepted',
            paymentStatus: 'paid',
            amount: 650,
            slotDate: '2026_4_24',
            slotTime: '14:30',
            userData: { name: 'Nina Patient', dob: '1991-08-02', image: '/nina.png' },
            docData: { name: 'Dr. Kapoor', speciality: 'Internal medicine' },
          },
        ],
      },
    });

    await userEvent.click(screen.getByRole('button', { name: /add note/i }));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/doctor/add-notes',
        { appointmentId: 'appointment-9', notes: 'Monitor blood pressure' },
        { headers: { dToken: 'doctor-token' } },
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Note added');

    await userEvent.click(screen.getByRole('button', { name: /prescribe/i }));
    await userEvent.type(screen.getByPlaceholderText(/medicine name/i), 'Amoxicillin');
    await userEvent.type(screen.getByPlaceholderText(/dosage/i), '500mg');
    await userEvent.type(screen.getByPlaceholderText(/duration/i), '5 days');
    await userEvent.type(screen.getByPlaceholderText(/instruction/i), 'After meals');
    await userEvent.click(screen.getByRole('button', { name: /add medicine/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit prescription/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenLastCalledWith(
        'http://localhost:4000/api/doctor/generate-prescription',
        {
          appointmentId: 'appointment-9',
          medicines: [
            {
              name: 'Amoxicillin',
              dosage: '500mg',
              duration: '5 days',
              instruction: 'After meals',
            },
          ],
        },
        { headers: { dToken: 'doctor-token' } },
      );
    });

    promptSpy.mockRestore();
  });
});
