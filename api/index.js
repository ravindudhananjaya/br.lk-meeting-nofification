const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// --- CONFIGURATION ---
// Set these in Vercel Environment Variables, or put them directly here
const TEXTLK_API_TOKEN = process.env.TEXTLK_API_TOKEN || 'YOUR_TEXTLK_API_TOKEN_HERE';
const SENDER_ID = process.env.SENDER_ID || 'TextLKDemo';

// --- HEALTH CHECK ENDPOINT ---
app.get('/', (req, res) => {
    res.status(200).send('Webhook server is running. Send POST requests to /webhooks/cal');
});

// --- MAIN WEBHOOK ENDPOINT ---
app.post('/webhooks/cal', async (req, res) => {
    const { triggerEvent, payload } = req.body;

    // Only triggers when a Booking is created
    if (triggerEvent === 'BOOKING_CREATED') {
        try {
            if (!payload.attendees || payload.attendees.length === 0) {
                console.log('No attendees found in payload');
                return res.status(200).send('No attendees found');
            }

            const startTime = new Date(payload.startTime);
            const attendeeName = payload.attendees[0].name;

            // 1. Get Phone number (Cal.com might send it in different ways)
            let rawPhone = payload.attendees[0].phoneNumber || payload.responses?.phone || "";

            // 2. Cleanup: Remove everything except digits (+, spaces, etc.)
            let cleanPhone = rawPhone.replace(/\D/g, '');

            // 3. Sri Lanka Conversion: If it starts with 077..., change to 9477...
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '94' + cleanPhone.substring(1);
            }

            // 4. Verification: Only allow numbers starting with 94
            if (!cleanPhone.startsWith('94')) {
                console.log(`Skipping SMS for non-Sri Lankan number: ${cleanPhone}`);
                return res.status(200).send('International number detected. No SMS sent.');
            }

            // 5. Meeting Link Extraction
            const meetingLink = payload.metadata?.videoCallUrl || payload.location || "Check email for link";

            console.log(`Scheduling messages for ${cleanPhone} at ${startTime}`);

            // --- SMS 1: Immediate Confirmation ---
            await sendSMS(
                cleanPhone,
                `Hi ${attendeeName},\nYour appointment is successfully scheduled.Time: ${startTime.toLocaleString('en-GB', { timeZone: 'Asia/Colombo' })}.\n\n Join here: ${meetingLink} \n Thank you for choosing br.lk. See you soon`
            );

            // --- SMS 2: 1 Hour Before Reminder ---
            const oneHourBefore = new Date(startTime.getTime() - (60 * 60 * 1000));
            // Only schedule if the time is in the future
            if (oneHourBefore > new Date()) {
                await sendSMS(
                    cleanPhone,
                    `Hello ${attendeeName},\nThis is a reminder that your meeting with br.lk starts in 1 hour.\n\nJoin Link: ${meetingLink}\nIf you need to reschedule or cancel,\n please let us know via WhatsApp: https://wa.me/94777895327`,
                    formatDateForTextLK(oneHourBefore)
                );
            }

            // --- SMS 3: 10 Minutes Before Reminder ---
            const tenMinsBefore = new Date(startTime.getTime() - (10 * 60 * 1000));
            if (tenMinsBefore > new Date()) {
                await sendSMS(
                    cleanPhone,
                    `Reminder: Your meeting with br.lk starts in 10 mins.\n\nClick to join: ${meetingLink}\nNeed to change or cancel?\nContact us on WhatsApp: https://wa.me/94777895327`,
                    formatDateForTextLK(tenMinsBefore)
                );
            }

            return res.status(200).json({ status: 'success', message: 'All messages processed' });

        } catch (error) {
            console.error('Error processing webhook:', error.message);
            return res.status(500).send('Internal Server Error');
        }
    }

    // Ignore other events
    res.status(200).send('Webhook received, but not a booking event.');
});

// --- HELPER FUNCTIONS ---

// Function to send SMS via Text.lk API
async function sendSMS(phone, message, scheduleTime = null) {
    const url = 'https://app.text.lk/api/v3/sms/send';
    const data = {
        recipient: phone,
        sender_id: SENDER_ID,
        type: 'plain',
        message: message
    };

    // Add scheduleTime only if it exists
    if (scheduleTime) {
        data.schedule_time = scheduleTime;
    }

    console.log('[TextLK] Sending SMS Request:', JSON.stringify(data));

    // Append schedule_time to URL as well just in case
    let finalUrl = url;
    if (scheduleTime) {
        finalUrl += `?schedule_time=${encodeURIComponent(scheduleTime)}`;
    }

    try {
        const response = await axios.post(finalUrl, data, {
            headers: {
                'Authorization': `Bearer ${TEXTLK_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        console.log('[TextLK] Response:', response.data);
        return response;
    } catch (error) {
        console.error('[TextLK] Error:', error.response?.data || error.message);
        throw error;
    }
}

// Formats time to "YYYY-MM-DD HH:MM" required by Text.lk
// Formats time to "YYYY-MM-DD HH:MM" required by Text.lk (Sri Lanka Time Zone: UTC+5:30)
function formatDateForTextLK(date) {
    // Use Intl.DateTimeFormat to correctly convert to TimeZone (Format: YYYY-MM-DD HH:MM)
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type) => parts.find(p => p.type === type).value;

    const yyyy = getPart('year');
    const mm = getPart('month');
    const dd = getPart('day');
    const hh = getPart('hour');
    const min = getPart('minute');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// Required for Vercel deployment
module.exports = app;