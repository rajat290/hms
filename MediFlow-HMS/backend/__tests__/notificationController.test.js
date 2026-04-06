import { jest } from '@jest/globals';

const sendAppointmentReminderEmailMock = jest.fn();
const findOneAndUpdateMock = jest.fn();
const updateOneMock = jest.fn();
const findMock = jest.fn();

jest.unstable_mockModule('../services/emailService.js', () => ({
  sendAppointmentReminderEmail: sendAppointmentReminderEmailMock,
  logEmailFailure: jest.fn(),
}));

jest.unstable_mockModule('../models/appointmentModel.js', () => ({
  default: {
    find: findMock,
    findOneAndUpdate: findOneAndUpdateMock,
    updateOne: updateOneMock,
  },
}));

const { sendReminders } = await import('../controllers/notificationController.js');

const createPopulatedQuery = (appointments) => {
  const query = Promise.resolve(appointments);
  query.populate = jest.fn(() => query);
  return query;
};

describe('notificationController sendReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findOneAndUpdateMock.mockResolvedValue(null);
  });

  it('sends a 2-hour reminder and marks the appointment', async () => {
    const reminderDate = new Date(Date.now() + 60 * 60 * 1000);
    const slotDate = `${reminderDate.getDate()}_${reminderDate.getMonth() + 1}_${reminderDate.getFullYear()}`;
    const slotTime = reminderDate.toTimeString().slice(0, 5);

    findMock.mockReturnValueOnce(
      createPopulatedQuery([
        {
          _id: 'apt-1',
          slotDate,
          slotTime,
          userId: { name: 'Alice', email: 'alice@example.com' },
          docId: { name: 'Dr. Smith' },
          reminderSent24h: false,
          reminderSent2h: false,
        },
      ])
    );
    findOneAndUpdateMock.mockResolvedValueOnce({ _id: 'apt-1' });

    await sendReminders();

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'apt-1',
        reminderSent2h: false,
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          reminder2hLockUntil: expect.any(Date),
        }),
      }),
      { new: true }
    );
    expect(sendAppointmentReminderEmailMock).toHaveBeenCalledTimes(1);
    expect(updateOneMock).toHaveBeenCalledWith(
      { _id: 'apt-1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          reminderSent2h: true,
          reminderSent2hAt: expect.any(Date),
        }),
        $unset: { reminder2hLockUntil: '' },
      })
    );
  });

  it('skips reminders that were already sent', async () => {
    const reminderDate = new Date(Date.now() + 60 * 60 * 1000);
    const slotDate = `${reminderDate.getDate()}_${reminderDate.getMonth() + 1}_${reminderDate.getFullYear()}`;
    const slotTime = reminderDate.toTimeString().slice(0, 5);

    findMock.mockReturnValueOnce(
      createPopulatedQuery([
        {
          _id: 'apt-2',
          slotDate,
          slotTime,
          userId: { name: 'Bob', email: 'bob@example.com' },
          docId: { name: 'Dr. Jones' },
          reminderSent24h: false,
          reminderSent2h: true,
        },
      ])
    );

    await sendReminders();

    expect(sendAppointmentReminderEmailMock).not.toHaveBeenCalled();
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
    expect(updateOneMock).not.toHaveBeenCalled();
  });
});
