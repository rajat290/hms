import express from 'express';
import crypto from 'crypto';
import stripe from 'stripe';
import { finalizeAppointmentPayment } from '../utils/appointmentIntegrity.js';
import { runInTransaction } from '../utils/transaction.js';

const paymentRouter = express.Router();
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

// Razorpay Webhook
paymentRouter.post('/razorpay-webhook', express.json(), async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature === signature) {
            const event = req.body.event;
            const payload = req.body.payload;

            if (event === 'payment.captured') {
                const appointmentId = payload.payment.entity.notes.appointmentId || payload.payment.entity.receipt;
                await runInTransaction(async (session) => {
                    await finalizeAppointmentPayment({
                        appointmentId,
                        transactionId: payload.payment.entity.id,
                        paymentMethod: 'Online',
                        notes: 'Captured from Razorpay webhook',
                        processedBy: 'razorpay-webhook',
                        session,
                    });
                });
            }
            res.status(200).send('Webhook received');
        } else {
            res.status(400).send('Invalid signature');
        }
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        res.status(500).send('Internal server error');
    }
});

// Stripe Webhook (Requires raw body)
paymentRouter.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Stripe webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const appointmentId = session.client_reference_id || (session.metadata ? session.metadata.appointmentId : null);

        if (appointmentId) {
            await runInTransaction(async (dbSession) => {
                await finalizeAppointmentPayment({
                    appointmentId,
                    transactionId: session.payment_intent || session.id,
                    paymentMethod: 'Online',
                    notes: 'Completed from Stripe webhook',
                    processedBy: 'stripe-webhook',
                    session: dbSession,
                });
            });
        }
    }

    res.status(200).json({ received: true });
});

export default paymentRouter;
