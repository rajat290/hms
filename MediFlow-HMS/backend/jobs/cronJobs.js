import nodemailer from 'nodemailer';
import cron from 'node-cron';
import invoiceModel from '../models/invoiceModel.js';
import { sendReminders } from '../controllers/notificationController.js';

const checkOverdueInvoices = async () => {
    try {
        console.log('Running Overdue Invoice Check...');
        const currentDate = new Date();

        // Find unpaid invoices past due date
        const overdueInvoices = await invoiceModel.find({
            status: 'unpaid',
            dueDate: { $lt: currentDate }
        }).populate('patientId');

        if (overdueInvoices.length === 0) {
            console.log('No overdue invoices found.');
            return;
        }

        console.log(`Found ${overdueInvoices.length} overdue invoices.`);

        // Email Config
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        for (const invoice of overdueInvoices) {
            const patient = invoice.patientId;
            if (patient && patient.email) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: patient.email,
                    subject: `Overdue Invoice Alert: ${invoice.invoiceNumber}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Payment Reminder</h2>
                            <p>Dear ${patient.name},</p>
                            <p>This is a reminder that your invoice <strong>${invoice.invoiceNumber}</strong> was due on ${new Date(invoice.dueDate).toDateString()}.</p>
                            <p>Total Amount: <strong>$${invoice.totalAmount}</strong></p>
                            <p>Please make the payment at your earliest convenience to avoid interruptions in service.</p>
                            <p>Thank you,<br>Mediflow Admin</p>
                        </div>
                    `
                };

                // Send Email (Async, don't block loop)
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) console.error(`Failed to email ${patient.email}:`, err);
                    else console.log(`Reminder sent to ${patient.email}`);
                });
            }
        }
    } catch (error) {
        console.error('Error in cron job:', error);
    }
};

// Initialize Cron Jobs
const initCronJobs = () => {
    // Run every day at 9:00 AM for overdue invoices
    cron.schedule('0 9 * * *', () => {
        checkOverdueInvoices();
    });

    // Run every hour to check for upcoming appointment reminders
    cron.schedule('0 * * * *', () => {
        sendReminders();
    });

    console.log('Cron jobs initialized: Overdue checks (09:00) and Appointment reminders (hourly).');
};

export default initCronJobs;
