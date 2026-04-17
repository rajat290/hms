import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import axios from 'axios';
import StaffAddPatient from '../StaffAddPatient';
import { StaffContext } from '../../../context/StaffContext';
import { AppContext } from '../../../context/AppContext';

vi.mock('axios');
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const renderStaffAddPatient = ({
  staffContext = {},
  appContext = {},
} = {}) => {
  const mergedStaffContext = {
    sToken: 'staff-token',
    ...staffContext,
  };

  const mergedAppContext = {
    backendUrl: 'http://localhost:4000',
    ...appContext,
  };

  render(
    <AppContext.Provider value={mergedAppContext}>
      <StaffContext.Provider value={mergedStaffContext}>
        <StaffAddPatient />
      </StaffContext.Provider>
    </AppContext.Provider>,
  );

  return { mergedStaffContext, mergedAppContext };
};

describe('StaffAddPatient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks submission when required fields are missing', async () => {
    renderStaffAddPatient();

    await userEvent.click(screen.getByRole('button', { name: /register patient/i }));

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('submits patient registration data and shows created credentials', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Patient created successfully',
        credentials: {
          email: 'jane@patient.com',
          password: 'TempPass123',
        },
      },
    });

    renderStaffAddPatient();

    await userEvent.type(screen.getByPlaceholderText(/john doe/i), 'Jane Doe');
    await userEvent.type(screen.getByPlaceholderText(/john@example\.com/i), 'jane@patient.com');
    await userEvent.type(screen.getByPlaceholderText(/9876543210/i), '9876543210');
    await userEvent.type(screen.getByLabelText(/date of birth/i), '1994-05-12');
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'Female');
    await userEvent.type(screen.getByPlaceholderText(/area \/ city/i), 'Kolkata');
    await userEvent.type(screen.getByPlaceholderText(/allergies or chronic conditions/i), 'Dust allergy');
    await userEvent.click(screen.getByRole('button', { name: /register patient/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    const [url, formData, config] = axios.post.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/staff/create-patient');
    expect(config).toEqual({ headers: { sToken: 'staff-token' } });
    expect(Object.fromEntries(formData.entries())).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@patient.com',
      phone: '9876543210',
      dob: '1994-05-12',
      gender: 'Female',
      patientCategory: 'Standard',
      chronicConditions: 'Dust allergy',
      address: JSON.stringify({ line1: 'Kolkata', line2: '' }),
    });

    expect(await screen.findByText(/patient created/i)).toBeInTheDocument();
    expect(screen.getByText(/temporary password:/i)).toBeInTheDocument();
  });
});
