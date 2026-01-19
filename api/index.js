const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// --- CONFIGURATION ---
const TEXTLK_API_TOKEN = process.env.TEXTLK_API_TOKEN || 'YOUR_TEXTLK_API_TOKEN_HERE';
const SENDER_ID = process.env.SENDER_ID || 'TextLKDemo';
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.APP_URL; // e.g., https://your-project.vercel.app

// --- HEALTH CHECK ENDPOINT ---
app.get('/', (req, res) => {
    res.status(200).send('Webhook server is running. Send POST requests to /webhooks/cal');
});

// --- REMINDER ENDPOINT (Called by QStash) ---
app.post('/api/send-reminder', async (req, res) => {
    // Basic security check (optional but recommended: verify QStash signature)
    // For now, checks if called internally or has data
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).send('Missing phone or message');
    }

    console.log(`[Reminder Endpoint] Triggered for ${phone}`);

    try {
        await sendSMS(phone, message);
        res.status(200).send('Reminder sent successfully');
    } catch (error) {
        console.error('[Reminder Endpoint] Failed to send SMS:', error.message);
        res.status(500).send('Failed to send SMS');
    }
});

// --- MAIN WEBHOOK ENDPOINT ---
app.post('/webhooks/cal', async (req, res) => {
    const { triggerEvent, payload } = req.body;

    if (triggerEvent === 'BOOKING_CREATED') {
        try {
            if (!payload.attendees || payload.attendees.length === 0) {
                console.log('No attendees found in payload');
                return res.status(200).send('No attendees found');
            }

            const startTime = new Date(payload.startTime);
            const attendeeName = payload.attendees[0].name;

            // Phone number processing
            let rawPhone = payload.attendees[0].phoneNumber || payload.responses?.phone || "";
            let cleanPhone = rawPhone.replace(/\D/g, '');

            if (cleanPhone.startsWith('0')) {
                cleanPhone = '94' + cleanPhone.substring(1);
            }

            if (!cleanPhone.startsWith('94')) {
                console.log(`Skipping SMS for non-Sri Lankan number: ${cleanPhone}`);
                return res.status(200).send('International number detected. No SMS sent.');
            }

            const meetingLink = payload.metadata?.videoCallUrl || payload.location || "Check email for link";
            const rescheduleLink = `https://cal.com/reschedule/${payload.uid}`;

            console.log('=== BOOKING DEBUG ===');
            console.log('Start Time (UTC):', startTime.toISOString());
            console.log('Current Time (UTC):', new Date().toISOString());
            console.log('====================');

            // --- SMS 1: Immediate Confirmation ---
            await sendSMS(
                cleanPhone,
                `Hi ${attendeeName},\nYour appointment is successfully scheduled. Time: ${startTime.toLocaleString('en-GB', { timeZone: 'Asia/Colombo' })}.\n\nJoin here: ${meetingLink}\nNeed to change? Reschedule here: ${rescheduleLink}\nThank you for choosing br.lk. See you soon`
            );

            // --- SMS 2: 1 Hour Before Reminder ---
            const oneHourBefore = new Date(startTime.getTime() - (60 * 60 * 1000));
            const now = new Date();

            if (oneHourBefore > now) {
                const delaySeconds = Math.floor((oneHourBefore.getTime() - now.getTime()) / 1000);
                console.log(`Scheduling 1-hour reminder in ${delaySeconds} seconds`);

                await scheduleWithQStash(
                    cleanPhone,
                    `Hello ${attendeeName},\nThis is a reminder that your meeting with br.lk starts in 1 hour.\n\nJoin Link: ${meetingLink}\nNeed to reschedule? ${rescheduleLink}\nOr contact us via WhatsApp: https://wa.me/94777895327`,
                    delaySeconds
                );
            } else {
                console.log('Skipping 1-hour reminder - time is in the past');
            }

            // --- SMS 3: 10 Minutes Before Reminder ---
            const tenMinsBefore = new Date(startTime.getTime() - (10 * 60 * 1000));

            if (tenMinsBefore > now) {
                const delaySeconds = Math.floor((tenMinsBefore.getTime() - now.getTime()) / 1000);
                console.log(`Scheduling 10-min reminder in ${delaySeconds} seconds`);

                await scheduleWithQStash(
                    cleanPhone,
                    `Reminder: Your meeting with br.lk starts in 10 mins.\n\nClick to join: ${meetingLink}\nNeed to change? ${rescheduleLink}\nOr WhatsApp: https://wa.me/94777895327`,
                    delaySeconds
                );
            } else {
                console.log('Skipping 10-min reminder - time is in the past');
            }

            return res.status(200).json({ status: 'success', message: 'All messages processed' });

        } catch (error) {
            console.error('Error processing webhook:', error.message);
            return res.status(500).send('Internal Server Error');
        }
    }

    res.status(200).send('Webhook received, but not a booking event.');
});

// --- HELPER FUNCTIONS ---

async function sendSMS(phone, message) {
    const url = 'https://app.text.lk/api/v3/sms/send';

    const payload = {
        recipient: phone,
        sender_id: SENDER_ID,
        type: 'plain',
        message: message
    };

    console.log(`[TextLK] Sending immediate SMS to ${phone}`);

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${TEXTLK_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log(`[TextLK] Response:`, response.data);
        return response;
    } catch (error) {
        console.error('[TextLK] Error:', error.response?.data || error.message);
        throw error;
    }
}

async function scheduleWithQStash(phone, message, delaySeconds) {
    if (!QSTASH_TOKEN || !APP_URL) {
        console.warn('Skipping QStash scheduling: QSTASH_TOKEN or APP_URL not set');
        return;
    }

    const url = `https://qstash.upstash.io/v2/publish/${APP_URL}/api/send-reminder`;

    try {
        const response = await axios.post(
            url,
            { phone, message },
            {
                headers: {
                    'Authorization': `Bearer ${QSTASH_TOKEN}`,
                    'Upstash-Delay': `${delaySeconds}s`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`[QStash] Scheduled SMS for ${phone} in ${delaySeconds}s. ID: ${response.data.messageId}`);
    } catch (error) {
        console.error('[QStash] Error:', error.response?.data || error.message);
        // Don't throw here to avoid failing the whole webhook if scheduling fails
    }
}

// Required for Vercel deployment
module.exports = app;