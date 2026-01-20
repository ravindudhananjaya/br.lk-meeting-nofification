const axios = require('axios');

// CONFIGURATION
const APP_URL = process.env.APP_URL || 'https://br-lk-meeting-nofification.vercel.app'; // Fallback to deployed URL
const TEST_PHONE = process.env.TEST_PHONE || '94777123456'; // User needs to set this or change it
const ENDPOINT = `${APP_URL}/webhooks/cal`;

async function triggerTest() {
    // 1. Calculate a time that triggers the "1 Hour Reminder" immediately (or very soon)
    // We want (StartTime - 1 hour) to be approx 2 minutes in the future.
    // So StartTime = Now + 1 hour + 2 minutes.
    const now = new Date();
    const startTime = new Date(now.getTime() + (60 * 60 * 1000) + (2 * 60 * 1000)); // Now + 62 mins

    console.log(`Current Time: ${now.toISOString()}`);
    console.log(`Test Meeting Start Time: ${startTime.toISOString()}`);
    console.log(`Expected '1-Hour Reminder' Schedule Time: ${new Date(startTime.getTime() - 3600000).toISOString()} (~2 mins from now)`);

    const payload = {
        triggerEvent: "BOOKING_CREATED",
        payload: {
            uid: `test-reminder-${Date.now()}`,
            startTime: startTime.toISOString(),
            attendees: [
                {
                    name: "Test User",
                    phoneNumber: TEST_PHONE,
                    email: "test@example.com"
                }
            ],
            metadata: {
                videoCallUrl: "https://meet.google.com/test-link"
            },
            location: "Google Meet"
        }
    };

    console.log(`\nSending webhook to: ${ENDPOINT}`);

    try {
        const response = await axios.post(ENDPOINT, payload);
        console.log('✅ Webhook sent successfully!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        console.log('\n--- VERIFICATION STEPS ---');
        console.log('1. Check Text.lk / WhatsApp: You should receive the "Confirmation" message IMMEDIATELY.');
        console.log('2. Check Upstash QStash Console: Look for a message scheduled to run in approx 120 seconds.');
        console.log('3. Wait 2 minutes: You should receive the "1 Hour Reminder" via SMS & WhatsApp.');
    } catch (error) {
        console.error('❌ Failed to send webhook:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

// Check for arguments
if (process.argv[2]) {
    // If user passes a phone number argument
    // e.g., node test-webhook.js 9477xxxxxxx
    const phoneArg = process.argv[2];
    payload.payload.attendees[0].phoneNumber = phoneArg;
}

triggerTest();
