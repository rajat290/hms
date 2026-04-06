import appointmentModel from '../models/appointmentModel.js';
import { logEmailFailure, sendAppointmentReminderEmail } from '../services/emailService.js';
import { logger } from '../config/logger.js';

const REMINDER_LOCK_MINUTES = 20;

const getReminderMetadata = (reminderType) => {
    const isTwoHourReminder = reminderType === '2-hour';

    return {
        sentField: isTwoHourReminder ? 'reminderSent2h' : 'reminderSent24h',
        sentAtField: isTwoHourReminder ? 'reminderSent2hAt' : 'reminderSent24hAt',
        lockField: isTwoHourReminder ? 'reminder2hLockUntil' : 'reminder24hLockUntil',
    };
};

const sendReminders = async () => {
    try {
        logger.info('Checking for upcoming appointments to send reminders');

        const now = new Date();

        // Fetch all upcoming, non-cancelled, non-completed appointments
        const appointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false,
            // Filtering will be refined below
        }).populate('userId', 'name email').populate('docId', 'name');

        for (const appointment of appointments) {
            const { slotDate, slotTime, userId, docId, reminderSent24h, reminderSent2h } = appointment;

            if (!userId || !userId.email) continue;

            // Parse appointment date/time
            const [day, month, year] = slotDate.split('_');
            const [hours, minutes] = slotTime.split(':');
            const appointmentDate = new Date(year, month - 1, day, hours, minutes);

            const diffMs = appointmentDate - now;
            const diffHours = diffMs / (1000 * 60 * 60);

            let reminderType = '';

            if (diffHours > 0 && diffHours <= 2 && !reminderSent2h) {
                reminderType = '2-hour';
            } else if (diffHours > 2 && diffHours <= 24 && !reminderSent24h) {
                reminderType = '24-hour';
            }

            if (reminderType) {
                const { sentField, sentAtField, lockField } = getReminderMetadata(reminderType);
                const lockUntil = new Date(Date.now() + REMINDER_LOCK_MINUTES * 60 * 1000);
                const claimedAppointment = await appointmentModel.findOneAndUpdate(
                    {
                        _id: appointment._id,
                        [sentField]: false,
                        $or: [
                            { [lockField]: { $exists: false } },
                            { [lockField]: null },
                            { [lockField]: { $lte: now } }
                        ]
                    },
                    {
                        $set: { [lockField]: lockUntil }
                    },
                    { new: true }
                );

                if (!claimedAppointment) {
                    continue;
                }

                const mailOptions = {
                    email: userId.email,
                    patientName: userId.name,
                    doctorName: docId.name,
                    slotTime,
                    slotDate,
                };

                try {
                    await sendAppointmentReminderEmail(mailOptions);
                    logger.info(`Sent ${reminderType} reminder`, { email: userId.email, appointmentId: String(appointment._id) });

                    await appointmentModel.updateOne(
                        { _id: appointment._id },
                        {
                            $set: {
                                [sentField]: true,
                                [sentAtField]: new Date()
                            },
                            $unset: { [lockField]: '' }
                        }
                    );
                } catch (err) {
                    logEmailFailure('appointment reminder', err);
                    await appointmentModel.updateOne(
                        { _id: appointment._id },
                        { $unset: { [lockField]: '' } }
                    );
                }
            }
        }
    } catch (error) {
        logger.error('Error while sending reminders', { message: error.message });
    }
};

export { sendReminders };
