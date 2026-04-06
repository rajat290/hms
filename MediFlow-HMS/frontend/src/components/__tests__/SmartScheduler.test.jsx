import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import axios from 'axios';
import SmartScheduler from '../SmartScheduler';
import { AppContext } from '../../context/AppContext';

vi.mock('axios');
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

const renderScheduler = () =>
  render(
    <AppContext.Provider value={{ backendUrl: 'http://localhost:4000' }}>
      <SmartScheduler />
    </AppContext.Provider>
  );

describe('SmartScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the scheduler form', () => {
    renderScheduler();

    expect(screen.getByText('AI Smart Scheduler')).toBeInTheDocument();
    expect(screen.getByText('Get optimal appointment time')).toBeInTheDocument();
  });

  it('requests and displays a suggested time', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, suggestedTime: '10:30' },
    });

    renderScheduler();

    await userEvent.type(screen.getByLabelText(/doctor id/i), 'doctor-123');
    await userEvent.type(screen.getByLabelText(/date/i), '2026-04-10');
    await userEvent.click(screen.getByRole('button', { name: /get suggestion/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/ai/smart-schedule',
        { doctorId: 'doctor-123', date: '2026-04-10' }
      );
    });

    expect(screen.getByText('Suggested Time: 10:30')).toBeInTheDocument();
  });
});
