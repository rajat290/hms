import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import axios from 'axios';
import Login from '../Login';
import { AdminContext } from '../../context/AdminContext';
import { DoctorContext } from '../../context/DoctorContext';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';

const mockNavigate = vi.fn();

vi.mock('axios');
vi.mock('@shared/config/clientConfig.js', () => ({
  createClientConfig: () => ({
    backendUrl: 'http://localhost:4000',
    currency: 'INR',
  }),
}));
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogin = ({
  adminContext = {},
  doctorContext = {},
  staffContext = {},
  appContext = {},
} = {}) => {
  const defaultAdminContext = {
    persistAdminSession: vi.fn(),
    clearAdminSession: vi.fn(),
  };

  const defaultDoctorContext = {
    persistDoctorSession: vi.fn(),
    clearDoctorSession: vi.fn(),
  };

  const defaultStaffContext = {
    persistStaffSession: vi.fn(),
    clearStaffSession: vi.fn(),
  };

  const defaultAppContext = {
    isDarkMode: false,
    setIsDarkMode: vi.fn(),
  };

  const mergedAdminContext = { ...defaultAdminContext, ...adminContext };
  const mergedDoctorContext = { ...defaultDoctorContext, ...doctorContext };
  const mergedStaffContext = { ...defaultStaffContext, ...staffContext };
  const mergedAppContext = { ...defaultAppContext, ...appContext };

  render(
    <MemoryRouter>
      <AppContext.Provider value={mergedAppContext}>
        <AdminContext.Provider value={mergedAdminContext}>
          <DoctorContext.Provider value={mergedDoctorContext}>
            <StaffContext.Provider value={mergedStaffContext}>
              <Login />
            </StaffContext.Provider>
          </DoctorContext.Provider>
        </AdminContext.Provider>
      </AppContext.Provider>
    </MemoryRouter>,
  );

  return {
    mergedAdminContext,
    mergedDoctorContext,
    mergedStaffContext,
    mergedAppContext,
  };
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in as admin and routes to the admin dashboard', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'admin-token',
        refreshToken: 'admin-refresh',
      },
    });

    const { mergedAdminContext, mergedDoctorContext, mergedStaffContext } = renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@hospital.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /continue as admin/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/admin/login',
        { email: 'admin@hospital.com', password: 'secret123' },
      );
    });

    expect(mergedDoctorContext.clearDoctorSession).toHaveBeenCalled();
    expect(mergedStaffContext.clearStaffSession).toHaveBeenCalled();
    expect(mergedAdminContext.persistAdminSession).toHaveBeenCalledWith('admin-token', 'admin-refresh');
    expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard', { replace: true });
  });

  it('switches role and signs in through the doctor endpoint', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'doctor-token',
        refreshToken: 'doctor-refresh',
      },
    });

    const { mergedAdminContext, mergedDoctorContext, mergedStaffContext } = renderLogin();

    await userEvent.click(screen.getByRole('button', { name: /switch to doctor/i }));
    await userEvent.type(screen.getByLabelText(/email address/i), 'doctor@hospital.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'doctorpass');
    await userEvent.click(screen.getByRole('button', { name: /continue as doctor/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/doctor/login',
        { email: 'doctor@hospital.com', password: 'doctorpass' },
      );
    });

    expect(mergedAdminContext.clearAdminSession).toHaveBeenCalled();
    expect(mergedStaffContext.clearStaffSession).toHaveBeenCalled();
    expect(mergedDoctorContext.persistDoctorSession).toHaveBeenCalledWith('doctor-token', 'doctor-refresh');
    expect(mockNavigate).toHaveBeenCalledWith('/doctor-dashboard', { replace: true });
  });
});
