import cron from 'node-cron';
import invoiceModel from '../models/invoiceModel.js';
import { sendReminders } from '../controllers/notificationController.js';
import { logger } from '../config/logger.js';
import { logEmailFailure, sendOverdueInvoiceEmail } from '../services/emailService.js';

let scheduledTasks = [];

const checkOverdueInvoices = async () => {
    try {
        logger.info('Running overdue invoice check');
        const currentDate = new Date();

        // Find unpaid invoices past due date
        const overdueInvoices = await invoiceModel.find({
            status: { $in: ['unpaid', 'partially paid'] },
            dueDate: { $lt: currentDate }
        }).populate('patientId');

        if (overdueInvoices.length === 0) {
            logger.info('No overdue invoices found');
            return;
        }

        logger.info(`Found ${overdueInvoices.length} overdue invoices`);

        await invoiceModel.updateMany(
            {
                _id: { $in: overdueInvoices.map(invoice => invoice._id) },
                status: { $in: ['unpaid', 'partially paid'] }
            },
            { $set: { status: 'overdue', updatedAt: new Date() } }
        );

        for (const invoice of overdueInvoices) {
            const patient = invoice.patientId;
            if (patient && patient.email) {
                try {
                    await sendOverdueInvoiceEmail({
                        email: patient.email,
                        patientName: patient.name,
                        invoiceNumber: invoice.invoiceNumber,
                        dueDate: invoice.dueDate,
                        totalAmount: invoice.totalAmount,
                    });
                    logger.info('Overdue invoice reminder sent', {
                        email: patient.email,
                        invoiceNumber: invoice.invoiceNumber,
                    });
                } catch (error) {
                    logEmailFailure('overdue invoice reminder', error);
                }
            }
        }
    } catch (error) {
        logger.error('Error in overdue invoice cron job', { message: error.message });
    }
};

// Initialize Cron Jobs
const initCronJobs = () => {
    if (scheduledTasks.length > 0) {
        return scheduledTasks;
    }

    // Run every day at 9:00 AM for overdue invoices
    const overdueTask = cron.schedule('0 9 * * *', () => {
        checkOverdueInvoices();
    });

    // Run every hour to check for upcoming appointment reminders
    const reminderTask = cron.schedule('0 * * * *', () => {
        sendReminders();
    });

    scheduledTasks = [overdueTask, reminderTask];
    logger.info('Cron jobs initialized: overdue checks (09:00) and appointment reminders (hourly)');
    return scheduledTasks;
};

const stopCronJobs = () => {
    if (scheduledTasks.length === 0) {
        return;
    }

    scheduledTasks.forEach((task) => task.stop());
    scheduledTasks = [];
    logger.info('Cron jobs stopped');
};

export default initCronJobs;
export { stopCronJobs };
