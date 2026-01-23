require('dotenv').config();
const axios = require('axios');

// Load configuration from .env
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TEMPLATE_CONFIRMATION = process.env.WHATSAPP_TEMPLATE_CONFIRMATION || 'meeting_confirmation';
const TEST_PHONE = process.argv[2] || '94777123456'; // Pass phone as argument

console.log('=== WhatsApp Configuration Test ===');
console.log('Phone Number ID:', WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing');
console.log('Access Token:', WHATSAPP_ACCESS_TOKEN ? `✅ Set (${WHATSAPP_ACCESS_TOKEN.substring(0, 20)}...)` : '❌ Missing');
console.log('Template Name:', WHATSAPP_TEMPLATE_CONFIRMATION);
console.log('Test Phone:', TEST_PHONE);
console.log('===================================\n');

async function testWhatsAppAPI() {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error('❌ Missing required environment variables!');
        console.error('Please ensure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set in .env');
        process.exit(1);
    }

    // Format phone number (remove + if present)
    const formattedPhone = TEST_PHONE.startsWith('+') ? TEST_PHONE.substring(1) : TEST_PHONE;

    // Test with latest API version
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    // Sample template data
    const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
            name: WHATSAPP_TEMPLATE_CONFIRMATION,
            language: { code: "en_US" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: 'text', text: 'Test User' },
                        { type: 'text', text: '22/01/2026, 10:00:00' },
                        { type: 'text', text: 'https://meet.google.com/test-link' }
                    ]
                }
            ]
        }
    };

    console.log('📤 Sending test WhatsApp message...\n');
    console.log('API Endpoint:', url);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('\n');

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS! WhatsApp message sent.');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('\n📱 Check your WhatsApp for the message!');

    } catch (error) {
        console.error('❌ FAILED to send WhatsApp message\n');
        console.error('Error Status:', error.response?.status);
        console.error('Error Status Text:', error.response?.statusText);
        console.error('Error Details:', JSON.stringify(error.response?.data, null, 2));
        console.error('\n🔍 Common Issues:');
        console.error('1. Template not approved in Meta Business Manager');
        console.error('2. Template name mismatch (check exact name in Meta)');
        console.error('3. Template parameters don\'t match the template structure');
        console.error('4. Access token expired or invalid');
        console.error('5. Phone number not in correct format (should be: 94XXXXXXXXX)');
        console.error('6. Phone number not registered for testing (if in development mode)');

        process.exit(1);
    }
}

// Run the test
testWhatsAppAPI();
