require('dotenv').config();
const axios = require('axios');

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('=== Fetching WhatsApp Templates ===\n');

async function listTemplates() {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error('❌ Missing required environment variables!');
        console.error('Please ensure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set in .env');
        process.exit(1);
    }

    // Get the WhatsApp Business Account ID first
    const phoneUrl = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}?fields=verified_name,display_phone_number,quality_rating,whatsapp_business_account_id`;

    try {
        console.log('📱 Fetching WhatsApp Business Account info...\n');

        const phoneResponse = await axios.get(phoneUrl, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
            }
        });

        const wabaId = phoneResponse.data.whatsapp_business_account_id;

        if (!wabaId) {
            console.error('❌ Could not retrieve WhatsApp Business Account ID');
            console.error('Response:', JSON.stringify(phoneResponse.data, null, 2));
            process.exit(1);
        }

        console.log('✅ WhatsApp Business Account ID:', wabaId);
        console.log('📞 Phone Number:', phoneResponse.data.display_phone_number || 'N/A');
        console.log('✅ Verified Name:', phoneResponse.data.verified_name || 'N/A');
        console.log('📊 Quality Rating:', phoneResponse.data.quality_rating || 'N/A');
        console.log('\n' + '='.repeat(50) + '\n');

        // Now fetch templates
        const templatesUrl = `https://graph.facebook.com/v22.0/${wabaId}/message_templates?fields=name,status,language,category,components`;

        console.log('📋 Fetching message templates...\n');

        const templatesResponse = await axios.get(templatesUrl, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
            }
        });

        const templates = templatesResponse.data.data;

        if (templates.length === 0) {
            console.log('⚠️  No templates found!');
            console.log('\nYou need to create templates in Meta Business Manager.');
            console.log('See TEMPLATE_CREATION_GUIDE.md for instructions.\n');
            return;
        }

        console.log(`Found ${templates.length} template(s):\n`);

        templates.forEach((template, index) => {
            console.log(`${index + 1}. Template: "${template.name}"`);
            console.log(`   Status: ${getStatusEmoji(template.status)} ${template.status}`);
            console.log(`   Language: ${template.language}`);
            console.log(`   Category: ${template.category}`);

            // Show body component if exists
            const bodyComponent = template.components?.find(c => c.type === 'BODY');
            if (bodyComponent) {
                console.log(`   Body Preview: ${bodyComponent.text?.substring(0, 100)}...`);
            }
            console.log('');
        });

        // Check for our specific templates
        console.log('='.repeat(50));
        console.log('\n🔍 Checking for required templates:\n');

        const confirmationTemplate = templates.find(t => t.name === 'meeting_confirmation');
        const reminderTemplate = templates.find(t => t.name === 'meeting_reminder');

        checkTemplate('meeting_confirmation', confirmationTemplate);
        checkTemplate('meeting_reminder', reminderTemplate);

        console.log('\n' + '='.repeat(50) + '\n');

        // Show recommendations
        if (!confirmationTemplate || confirmationTemplate.status !== 'APPROVED') {
            console.log('⚠️  ACTION REQUIRED: Create or approve "meeting_confirmation" template');
        }
        if (!reminderTemplate || reminderTemplate.status !== 'APPROVED') {
            console.log('⚠️  ACTION REQUIRED: Create or approve "meeting_reminder" template');
        }

        if (confirmationTemplate?.status === 'APPROVED' && reminderTemplate?.status === 'APPROVED') {
            console.log('✅ All required templates are approved!');
            console.log('\nYou can now test again:');
            console.log('  npm run test:whatsapp 94777895327\n');
        }

    } catch (error) {
        console.error('❌ Error fetching templates:\n');
        console.error('Status:', error.response?.status);
        console.error('Error:', JSON.stringify(error.response?.data, null, 2));

        if (error.response?.status === 401) {
            console.error('\n💡 Your access token may be expired or invalid.');
            console.error('Generate a new token in Meta Developers Console.');
        }

        process.exit(1);
    }
}

function getStatusEmoji(status) {
    switch (status) {
        case 'APPROVED': return '✅';
        case 'PENDING': return '⏳';
        case 'REJECTED': return '❌';
        default: return '❓';
    }
}

function checkTemplate(name, template) {
    if (!template) {
        console.log(`❌ "${name}" - NOT FOUND`);
        console.log(`   Action: Create this template in Meta Business Manager`);
        return;
    }

    if (template.status !== 'APPROVED') {
        console.log(`⚠️  "${name}" - Status: ${template.status}`);
        console.log(`   Action: Wait for approval or fix rejection issues`);
        return;
    }

    if (template.language !== 'en_US') {
        console.log(`⚠️  "${name}" - Wrong language: ${template.language}`);
        console.log(`   Action: Create template with language "English (US)"`);
        return;
    }

    console.log(`✅ "${name}" - APPROVED and ready to use!`);
}

// Run the script
listTemplates();
