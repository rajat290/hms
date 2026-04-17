import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.GEMINI_API_KEY = '';

const findByIdMock = jest.fn();
const generateAvailableSlotsMock = jest.fn();

jest.unstable_mockModule('../models/doctorModel.js', () => ({
  default: { findById: findByIdMock },
}));

jest.unstable_mockModule('../utils/slotGenerator.js', () => ({
  generateAvailableSlots: generateAvailableSlotsMock,
}));

const {
  conversationalAI,
  getSymptomSuggestions,
  smartSchedule,
} = await import('../controllers/aiController.js');

const createResponse = () => ({
  json: jest.fn(),
});

describe('aiController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns emergency-first symptom guidance for red-flag symptoms', async () => {
    const res = createResponse();

    await getSymptomSuggestions(
      {
        body: {
          symptoms: 'Chest pain and shortness of breath since this morning',
        },
      },
      res,
    );

    const payload = res.json.mock.calls[0][0];

    expect(payload.success).toBe(true);
    expect(payload.results.urgency.level).toBe('emergency');
    expect(payload.results.careAreas).toEqual(
      expect.arrayContaining(['Emergency medicine', 'Cardiology']),
    );
    expect(payload.results.nextSteps[0]).toMatch(/emergency care/i);
  });

  it('blocks emergency symptom chat from flowing through the model', async () => {
    const res = createResponse();

    await conversationalAI(
      {
        body: {
          message: 'I have chest pain and trouble breathing',
          chatHistory: [],
        },
      },
      res,
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        guardrailCategory: 'medical_emergency',
        requiresUrgentCare: true,
      }),
    );
  });

  it('suggests a real slot from the requested date when availability exists', async () => {
    const res = createResponse();
    findByIdMock.mockResolvedValueOnce({
      _id: 'doctor-123',
      name: 'Dr. Mehta',
      speciality: 'Cardiology',
      available: true,
      availability: { enabled: true },
      slots_booked: {},
    });

    generateAvailableSlotsMock.mockReturnValueOnce([
      { time: '09:00', datetime: new Date('2099-06-10T09:00:00') },
      { time: '10:30', datetime: new Date('2099-06-10T10:30:00') },
      { time: '12:00', datetime: new Date('2099-06-10T12:00:00') },
    ]);

    await smartSchedule(
      {
        body: {
          doctorId: '507f1f77bcf86cd799439011',
          date: '2099-06-10',
        },
      },
      res,
    );

    expect(generateAvailableSlotsMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        suggestedTime: '10:30',
        suggestion: expect.objectContaining({
          status: 'requested-date',
          doctorName: 'Dr. Mehta',
          suggestedTime: '10:30',
          alternativeTimes: ['09:00', '12:00'],
        }),
      }),
    );
  });

  it('falls forward to the next available day when the requested date is full', async () => {
    const res = createResponse();
    findByIdMock.mockResolvedValueOnce({
      _id: 'doctor-456',
      name: 'Dr. Shah',
      speciality: 'General medicine',
      available: true,
      availability: { enabled: true },
      slots_booked: {},
    });

    generateAvailableSlotsMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        { time: '09:30', datetime: new Date('2099-06-11T09:30:00') },
        { time: '11:00', datetime: new Date('2099-06-11T11:00:00') },
      ]);

    await smartSchedule(
      {
        body: {
          doctorId: '507f1f77bcf86cd799439012',
          date: '2099-06-10',
        },
      },
      res,
    );

    expect(generateAvailableSlotsMock).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        suggestedTime: '11:00',
        suggestion: expect.objectContaining({
          status: 'next-available',
          date: '2099-06-11',
          suggestedTime: '11:00',
        }),
      }),
    );
  });
});
