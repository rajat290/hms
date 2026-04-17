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

    await userEvent.click(screen.getByRole('button', { name: /create patient/i }));

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
        patient: {
          name: 'Jane Doe',
          email: 'jane@patient.com',
          phone: '9876543210',
          medicalRecordNumber: 'MRN-12345',
          aadharMasked: 'XXXX-XXXX-1234',
          accountStatus: 'active',
        },
      },
    });

    renderStaffAddPatient();

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@patient.com');
    await userEvent.type(screen.getByLabelText(/^phone$/i), '9876543210');
    await userEvent.type(screen.getByLabelText(/date of birth/i), '1994-05-12');
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'Female');
    await userEvent.type(screen.getByLabelText(/medical record number/i), 'MRN-12345');
    await userEvent.type(screen.getByLabelText(/aadhaar number/i), '123412341234');
    await userEvent.type(screen.getByLabelText(/insurance provider/i), 'MediCover');
    await userEvent.type(screen.getByLabelText(/insurance id/i), 'POL-009');
    await userEvent.type(screen.getByLabelText(/emergency contact name/i), 'Raj Doe');
    await userEvent.type(screen.getByLabelText(/emergency contact phone/i), '9999999998');
    await userEvent.type(screen.getByLabelText(/emergency relation/i), 'Brother');
    await userEvent.type(screen.getByLabelText(/address line 1/i), 'Kolkata');
    await userEvent.type(screen.getByLabelText(/address line 2/i), 'Salt Lake');
    await userEvent.click(screen.getByRole('button', { name: /create patient/i }));

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
      medicalRecordNumber: 'MRN-12345',
      aadharNumber: '123412341234',
      insuranceProvider: 'MediCover',
      insuranceId: 'POL-009',
      address: JSON.stringify({ line1: 'Kolkata', line2: 'Salt Lake' }),
      emergencyContact: JSON.stringify({
        name: 'Raj Doe',
        phone: '9999999998',
        relation: 'Brother',
      }),
    });

    expect(await screen.findByText(/patient created/i)).toBeInTheDocument();
    expect(screen.getByText(/temporary password:/i)).toBeInTheDocument();
    expect(screen.getByText(/aadhaar reference:/i)).toBeInTheDocument();
  });
});
