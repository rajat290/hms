import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.RAZORPAY_KEY_ID = 'rzp_test_fake';
process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_fake';
process.env.CURRENCY = 'INR';

const findByIdMock = jest.fn();
const generateAvailableSlotsMock = jest.fn();

jest.unstable_mockModule('../models/doctorModel.js', () => ({
  default: { findById: findByIdMock },
}));

jest.unstable_mockModule('../utils/slotGenerator.js', () => ({
  generateAvailableSlots: generateAvailableSlotsMock,
}));

const { getDoctorSlots } = await import('../controllers/userController.js');

const createResponse = () => ({
  json: jest.fn(),
});

describe('userController getDoctorSlots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an error when the doctor does not exist', async () => {
    findByIdMock.mockResolvedValueOnce(null);
    const res = createResponse();

    await getDoctorSlots({ params: { docId: 'missing-doctor' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Doctor not found',
    });
  });

  it('returns seven days of generated slots for a valid doctor', async () => {
    findByIdMock.mockResolvedValueOnce({
      _id: 'doctor-123',
      availability: {
        enabled: true,
        schedule: {
          monday: [{ start: '09:00', end: '11:00' }],
        },
      },
      slots_booked: {},
    });

    generateAvailableSlotsMock.mockReturnValue([{ time: '10:00' }]);

    const res = createResponse();
    await getDoctorSlots({ params: { docId: 'doctor-123' } }, res);

    const payload = res.json.mock.calls[0][0];

    expect(generateAvailableSlotsMock).toHaveBeenCalledTimes(7);
    expect(payload.success).toBe(true);
    expect(payload.slots).toHaveLength(7);
    expect(payload.slots[0]).toEqual([{ time: '10:00' }]);
  });
});
