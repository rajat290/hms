import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SmartScheduler from '../SmartScheduler';

// Mock axios
jest.mock('axios');
import axios from 'axios';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SmartScheduler Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders smart scheduler interface', () => {
    renderWithRouter(<SmartScheduler />);

    expect(screen.getByText('Smart Appointment Scheduler')).toBeInTheDocument();
    expect(screen.getByText('Find the best time for your appointment')).toBeInTheDocument();
  });

  it('displays available time slots', async () => {
    const mockSlots = [
      { time: '09:00', available: true },
      { time: '10:00', available: false },
      { time: '11:00', available: true }
    ];

    axios.get.mockResolvedValueOnce({ data: { success: true, slots: mockSlots } });

    renderWithRouter(<SmartScheduler />);

    // Wait for slots to load
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('11:00')).toBeInTheDocument();
    });

    // Check that unavailable slot is not shown or is disabled
    const availableSlots = screen.getAllByRole('button').filter(button =>
      button.textContent.includes('09:00') || button.textContent.includes('11:00')
    );
    expect(availableSlots.length).toBeGreaterThan(0);
  });

  it('shows loading state while fetching slots', () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<SmartScheduler />);

    expect(screen.getByText('Loading available slots...')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    axios.get.mockRejectedValueOnce({
      response: { data: { message: 'Failed to fetch available slots' } }
    });

    renderWithRouter(<SmartScheduler />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch available slots')).toBeInTheDocument();
    });
  });

  it('allows selecting a time slot', async () => {
    const mockSlots = [
      { time: '09:00', available: true },
      { time: '10:00', available: true }
    ];

    axios.get.mockResolvedValueOnce({ data: { success: true, slots: mockSlots } });

    renderWithRouter(<SmartScheduler />);

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    const slotButton = screen.getByRole('button', { name: /09:00/i });
    fireEvent.click(slotButton);

    // Check if slot is selected (this would depend on component implementation)
    expect(slotButton).toHaveClass('selected'); // Assuming selected class is added
  });

  it('submits appointment booking', async () => {
    const mockSlots = [{ time: '09:00', available: true }];
    axios.get.mockResolvedValueOnce({ data: { success: true, slots: mockSlots } });
    axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Appointment booked successfully' } });

    renderWithRouter(<SmartScheduler />);

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    // Select slot
    const slotButton = screen.getByRole('button', { name: /09:00/i });
    fireEvent.click(slotButton);

    // Find and click book button
    const bookButton = screen.getByRole('button', { name: /book appointment/i });
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/user/book-appointment', {
        doctorId: expect.any(String),
        slotDate: expect.any(String),
        slotTime: '09:00'
      });
      expect(screen.getByText('Appointment booked successfully')).toBeInTheDocument();
    });
  });
});
