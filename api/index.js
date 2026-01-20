const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// --- CONFIGURATION ---
const TEXTLK_API_TOKEN = process.env.TEXTLK_API_TOKEN || 'YOUR_TEXTLK_API_TOKEN_HERE';
const SENDER_ID = process.env.SENDER_ID || 'TextLKDemo';
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.APP_URL; // e.g., https://your-project.vercel.app

// WhatsApp Configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TEMPLATE_CONFIRMATION = process.env.WHATSAPP_TEMPLATE_CONFIRMATION || 'meeting_confirmation';
const WHATSAPP_TEMPLATE_REMINDER = process.env.WHATSAPP_TEMPLATE_REMINDER || 'meeting_reminder';

// --- HEALTH CHECK ENDPOINT ---
app.get('/', (req, res) => {
    res.status(200).send('Webhook server is running. Send POST requests to /webhooks/cal');
});

// --- REMINDER ENDPOINT (Called by QStash) ---
app.post('/api/send-reminder', async (req, res) => {
    // Basic security check (optional but recommended: verify QStash signature)
    // For now, checks if called internally or has data
    const { phone, message, whatsappParams } = req.body;

    if (!phone) {
        return res.status(400).send('Missing phone number');
    }

    console.log(`[Reminder Endpoint] Triggered for ${phone}`);
    const results = {};

    // 1. Send SMS (if message is provided)
    if (message) {
        try {
            await sendSMS(phone, message);
            results.sms = 'sent';
        } catch (error) {
            console.error('[Reminder Endpoint] Failed to send SMS:', error.message);
            results.sms = 'failed';
        }
    }

    // 2. Send WhatsApp (if params provided)
    if (whatsappParams) {
        try {
            // whatsappParams should contain { templateName, components }
            // but we might just pass the raw data needed for the reminder template
            // For simplicity in this QStash payload, let's expect the full params or construct them
            // We expect whatsappParams to contain { template, components }
            await sendWhatsApp(phone, whatsappParams.template, whatsappParams.components);
            results.whatsapp = 'sent';
        } catch (error) {
            console.error('[Reminder Endpoint] Failed to send WhatsApp:', error.message);
            results.whatsapp = 'failed';
        }
    }

    res.status(200).json({ status: 'processed', results });
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

            const formattedTime = startTime.toLocaleString('en-GB', { timeZone: 'Asia/Colombo' });

            // --- 1. Immediate Confirmation ---
            // SMS
            await sendSMS(
                cleanPhone,
                `Hi ${attendeeName},\nYour appointment is successfully scheduled. Time: ${formattedTime}.\n\nJoin here: ${meetingLink}\nNeed to change? Reschedule here: ${rescheduleLink}\nThank you for choosing br.lk. See you soon`
            );

            // WhatsApp (Template: Confirmation)
            // Assumed Template Vars: {{1}}=Name, {{2}}=Time, {{3}}=Link
            await sendWhatsApp(cleanPhone, WHATSAPP_TEMPLATE_CONFIRMATION, [
                { type: 'text', text: attendeeName },
                { type: 'text', text: formattedTime },
                { type: 'text', text: meetingLink }
            ]);

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

async function sendWhatsApp(phone, templateName, components) {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.log('[WhatsApp] Skipping. Configuration missing.');
        return;
    }

    const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    // Transform simple components list to Meta's format if needed
    // Assuming simple list of {type: 'text', text: 'val'} passed in
    const bodyParameters = components.map(c => ({
        type: c.type,
        text: c.text
    }));

    const payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en_US" }, // Defaulting to English
            components: [
                {
                    type: "body",
                    parameters: bodyParameters
                }
            ]
        }
    };

    console.log(`[WhatsApp] Sending template '${templateName}' to ${phone}`);

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('[WhatsApp] Success:', response.data);
        return response;
    } catch (error) {
        console.error('[WhatsApp] Error:', error.response?.data || error.message);
        // Log but don't throw
    }
}

async function scheduleWithQStash(phone, smsMessage, whatsappParams, delaySeconds) {
    if (!QSTASH_TOKEN || !APP_URL) {
        console.warn('Skipping QStash scheduling: QSTASH_TOKEN or APP_URL not set');
        return;
    }

    const url = `https://qstash.upstash.io/v2/publish/${APP_URL}/api/send-reminder`;

    // Wrapper payload for our endpoint
    const payload = {
        phone,
        message: smsMessage,
        whatsappParams // { template, components }
    };

    try {
        const response = await axios.post(
            url,
            payload,
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
    }
}

// Required for Vercel deployment
module.exports = app;