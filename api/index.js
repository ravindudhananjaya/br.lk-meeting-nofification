const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// --- CONFIGURATION ---
const TEXTLK_API_TOKEN = process.env.TEXTLK_API_TOKEN || 'YOUR_TEXTLK_API_TOKEN_HERE';
const SENDER_ID = process.env.SENDER_ID || 'TextLKDemo';

// --- HEALTH CHECK ENDPOINT ---
app.get('/', (req, res) => {
    res.status(200).send('Webhook server is running. Send POST requests to /webhooks/cal');
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
            if (oneHourBefore > new Date()) {
                const scheduleTime = formatDateForTextLK(oneHourBefore);
                console.log('Scheduling 1-hour reminder for:', scheduleTime);

                await sendSMS(
                    cleanPhone,
                    `Hello ${attendeeName},\nThis is a reminder that your meeting with br.lk starts in 1 hour.\n\nJoin Link: ${meetingLink}\nNeed to reschedule? ${rescheduleLink}\nOr contact us via WhatsApp: https://wa.me/94777895327`,
                    scheduleTime
                );
            } else {
                console.log('Skipping 1-hour reminder - time is in the past');
            }

            // --- SMS 3: 10 Minutes Before Reminder ---
            const tenMinsBefore = new Date(startTime.getTime() - (10 * 60 * 1000));
            if (tenMinsBefore > new Date()) {
                const scheduleTime = formatDateForTextLK(tenMinsBefore);
                console.log('Scheduling 10-min reminder for:', scheduleTime);

                await sendSMS(
                    cleanPhone,
                    `Reminder: Your meeting with br.lk starts in 10 mins.\n\nClick to join: ${meetingLink}\nNeed to change? ${rescheduleLink}\nOr WhatsApp: https://wa.me/94777895327`,
                    scheduleTime
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

async function sendSMS(phone, message, scheduleTime = null) {
    const url = 'https://app.text.lk/api/v3/sms/send';

    const payload = {
        recipient: phone,
        sender_id: SENDER_ID,
        type: 'plain',
        message: message
    };

    if (scheduleTime) {
        payload.schedule_time = scheduleTime;
        console.log(`[TextLK] Scheduling SMS for ${phone} at: ${scheduleTime}`);
    } else {
        console.log(`[TextLK] Sending immediate SMS to ${phone}`);
    }

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

// FIXED: Proper timezone conversion
function formatDateForTextLK(date) {
    const pad = (num) => num.toString().padStart(2, '0');

    // Use Intl.DateTimeFormat to get proper components in Asia/Colombo timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getValue = (type) => parts.find(p => p.type === type)?.value;

    const year = getValue('year');
    const month = getValue('month');
    const day = getValue('day');
    const hour = getValue('hour');
    const minute = getValue('minute');

    const formatted = `${year}-${month}-${day} ${hour}:${minute}`;

    console.log(`[DateFormat] UTC: ${date.toISOString()} -> Sri Lanka: ${formatted}`);

    return formatted;
}

// Required for Vercel deployment
module.exports = app;