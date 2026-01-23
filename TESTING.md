# Quick Test Commands

## Test WhatsApp Only
```bash
# Test with your phone number
npm run test:whatsapp 94777123456
```

## Test Full Webhook (SMS + WhatsApp + Scheduling)
```bash
npm run test:webhook
```

## Run Local Development Server
```bash
npm run dev
```

## Check Logs in Production
```bash
# Go to: https://vercel.com/dashboard
# Select: br-lk-meeting-nofification
# Click: Logs tab
```

## Common Test Phone Numbers
- Format: `94XXXXXXXXX` (no + prefix)
- Example: `94777123456`

## What Each Test Does

### `test:whatsapp`
- ✅ Tests WhatsApp API connection
- ✅ Validates access token
- ✅ Checks template configuration
- ✅ Verifies phone number format
- ❌ Does NOT test SMS or scheduling

### `test:webhook`
- ✅ Tests complete booking flow
- ✅ Sends SMS confirmation
- ✅ Sends WhatsApp confirmation
- ✅ Schedules reminders via QStash
- ⏱️ Reminders scheduled for 2 minutes later (for testing)
