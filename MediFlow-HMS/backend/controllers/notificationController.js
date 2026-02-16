import nodemailer from 'nodemailer';
import appointmentModel from '../models/appointmentModel.js';

const sendReminders = async () => {
    try {
        console.log('Checking for upcoming appointments to send reminders...');

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // Fetch all upcoming, non-cancelled, non-completed appointments
        const appointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false,
            // Filtering will be refined below
        }).populate('userId', 'name email').populate('docId', 'name');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

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
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: userId.email,
                    subject: `Appointment Reminder - Dr. ${docId.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Appointment Reminder</h2>
                            <p>Dear ${userId.name},</p>
                            <p>This is a reminder for your upcoming appointment with <strong>Dr. ${docId.name}</strong>.</p>
                            <p><strong>Time:</strong> ${slotTime} on ${slotDate.replace(/_/g, '/')}</p>
                            <p>Please arrive 10 minutes before your scheduled time.</p>
                            <p>Thank you,<br>The Mediflow Team</p>
                        </div>
                    `
                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Sent ${reminderType} reminder to ${userId.email}`);

                    await appointmentModel.updateOne(
                        { _id: appointment._id },
                        { $set: { [reminderType === '2-hour' ? 'reminderSent2h' : 'reminderSent24h']: true } }
                    );
                } catch (err) {
                    console.error(`Failed to send reminder to ${userId.email}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('Error in sendReminders:', error);
    }
};

export { sendReminders };
