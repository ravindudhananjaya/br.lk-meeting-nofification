const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// --- CONFIGURATION ---
// Vercel Environment Variables වල මේවා set කරන්න, නැත්නම් මෙතනට කෙලින්ම දාන්න
const TEXTLK_API_TOKEN = process.env.TEXTLK_API_TOKEN || 'YOUR_TEXTLK_API_TOKEN_HERE';
const SENDER_ID = process.env.SENDER_ID || 'TextLKDemo';

// --- MAIN WEBHOOK ENDPOINT ---
app.post('/webhooks/cal', async (req, res) => {
    const { triggerEvent, payload } = req.body;

    // Booking එකක් සිදු වූ විට පමණක් ක්‍රියාත්මක වේ
    if (triggerEvent === 'BOOKING_CREATED') {
        try {
            const startTime = new Date(payload.startTime);
            const attendeeName = payload.attendees[0].name;
            
            // 1. Phone number එක ලබා ගැනීම (Cal.com එකෙන් එවන විදි කිහිපයක් තිබිය හැක)
            let rawPhone = payload.attendees[0].phoneNumber || payload.responses.phone || "";

            // 2. Cleanup: ඉලක්කම් නොවන සියල්ල ඉවත් කරන්න (+, spaces, etc.)
            let cleanPhone = rawPhone.replace(/\D/g, '');

            // 3. Sri Lanka Conversion: 077... ලෙස ඇත්නම් 9477... කරන්න
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '94' + cleanPhone.substring(1);
            }

            // 4. Verification: 94 වලින් පටන් ගන්නා අංක පමණක් ඉඩ දෙන්න
            if (!cleanPhone.startsWith('94')) {
                console.log(`Skipping SMS for non-Sri Lankan number: ${cleanPhone}`);
                return res.status(200).send('International number detected. No SMS sent.');
            }

            console.log(`Scheduling messages for ${cleanPhone} at ${startTime}`);

            // --- SMS 1: Immediate Confirmation ---
            await sendSMS(
                cleanPhone, 
                `Hi ${attendeeName}, your booking is confirmed for ${startTime.toLocaleString('en-GB')}.`
            );

            // --- SMS 2: 1 Hour Before Reminder ---
            const oneHourBefore = new Date(startTime.getTime() - (60 * 60 * 1000));
            // දැන් වෙලාවට වඩා අනාගත වෙලාවක් නම් පමණක් schedule කරන්න
            if (oneHourBefore > new Date()) {
                await sendSMS(
                    cleanPhone, 
                    `Reminder: Your meeting starts in 1 hour.`, 
                    formatDateForTextLK(oneHourBefore)
                );
            }

            // --- SMS 3: 10 Minutes Before Reminder ---
            const tenMinsBefore = new Date(startTime.getTime() - (10 * 60 * 1000));
            if (tenMinsBefore > new Date()) {
                await sendSMS(
                    cleanPhone, 
                    `Quick reminder: Your meeting starts in 10 minutes!`, 
                    formatDateForTextLK(tenMinsBefore)
                );
            }

            return res.status(200).json({ status: 'success', message: 'All messages processed' });

        } catch (error) {
            console.error('Error processing webhook:', error.message);
            return res.status(500).send('Internal Server Error');
        }
    }

    // වෙනත් event එකක් නම් ignore කරන්න
    res.status(200).send('Webhook received, but not a booking event.');
});

// --- HELPER FUNCTIONS ---

// Text.lk API එකට SMS යවන function එක
async function sendSMS(phone, message, scheduleTime = null) {
    const url = 'https://app.text.lk/api/v3/sms/send';
    const data = {
        recipient: phone,
        sender_id: SENDER_ID,
        type: 'plain',
        message: message
    };

    // scheduleTime එකක් තිබේ නම් පමණක් add කරන්න
    if (scheduleTime) {
        data.schedule_time = scheduleTime;
    }

    return axios.post(url, data, {
        headers: {
            'Authorization': `Bearer ${TEXTLK_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
}

// වෙලාව Text.lk වලට අවශ්‍ය "YYYY-MM-DD HH:MM" format එකට සකසයි
function formatDateForTextLK(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// Vercel deployment සඳහා අවශ්‍ය වේ
module.exports = app;