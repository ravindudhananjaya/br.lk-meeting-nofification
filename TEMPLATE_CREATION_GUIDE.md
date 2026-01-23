# WhatsApp Template Creation Guide

## Template 1: Meeting Confirmation

### Basic Settings
- **Template Name:** `meeting_confirmation` (copy exactly, no spaces)
- **Category:** UTILITY
- **Language:** English (US)

### Template Content

**Body Text:**
```
Hi {{1}},

Your appointment with br.lk is confirmed for {{2}}.

Meeting Link: {{3}}

Thank you for choosing br.lk. See you soon!
```

**Variables:**
- `{{1}}` = Attendee Name (example: "John Doe")
- `{{2}}` = Meeting Time (example: "22/01/2026, 10:00:00")
- `{{3}}` = Meeting Link (example: "https://meet.google.com/abc-defg-hij")

---

## Template 2: Meeting Reminder

### Basic Settings
- **Template Name:** `meeting_reminder` (copy exactly, no spaces)
- **Category:** UTILITY
- **Language:** English (US)

### Template Content

**Body Text:**
```
Hello {{1}},

This is a reminder that your meeting with br.lk starts in {{2}}.

Join Link: {{3}}

See you soon!
```

**Variables:**
- `{{1}}` = Attendee Name (example: "John Doe")
- `{{2}}` = Time Until Meeting (example: "1 hour" or "10 mins")
- `{{3}}` = Meeting Link (example: "https://meet.google.com/abc-defg-hij")

---

## Step-by-Step: Create Template in Meta

### 1. Access Message Templates
- Go to: https://business.facebook.com/
- Click: **WhatsApp Manager** (left sidebar)
- Click: **Message Templates**
- Click: **Create Template** button

### 2. Fill in Basic Info
- **Template Name:** `meeting_confirmation`
- **Category:** Select **UTILITY**
- **Languages:** Select **English (US)** (not just "English")

### 3. Add Body Content
- In the **Body** section, paste the body text above
- The system will automatically detect `{{1}}`, `{{2}}`, `{{3}}` as variables
- Add sample values for each variable (for preview purposes)

### 4. Submit for Approval
- Click **Submit**
- Wait 24-48 hours for approval
- You'll receive an email when approved

### 5. Repeat for Reminder Template
- Create another template named `meeting_reminder`
- Use the reminder body text above
- Submit for approval

---

## Alternative: Check Template Names

If you already have templates but with different names, you can either:

### Option A: Update .env to Match Existing Templates
If your templates have different names in Meta, update your `.env` file:

```bash
WHATSAPP_TEMPLATE_CONFIRMATION="your_actual_template_name"
WHATSAPP_TEMPLATE_REMINDER="your_actual_reminder_name"
```

### Option B: List All Your Templates
I can create a script to list all your approved templates so you can see what's available.

---

## Quick Check: Do You Have Templates?

Run this command to see what templates Meta has for your account:

```bash
# We'll create a script to list templates
npm run list:templates
```

(Script coming next...)

---

## Common Mistakes

❌ **Wrong:** Template name has spaces: `meeting confirmation`
✅ **Correct:** Template name: `meeting_confirmation`

❌ **Wrong:** Language is "English" or "English (UK)"
✅ **Correct:** Language is "English (US)"

❌ **Wrong:** Template status is "Pending" or "Rejected"
✅ **Correct:** Template status is "Approved"

❌ **Wrong:** Different number of variables (2 or 4)
✅ **Correct:** Exactly 3 variables: `{{1}}`, `{{2}}`, `{{3}}`

---

## Next Steps

1. **Check if templates exist** in Meta Business Manager
2. **If they don't exist**, create them using the guide above
3. **Wait for approval** (24-48 hours)
4. **Re-run the test** once approved:
   ```bash
   npm run test:whatsapp 94777895327
   ```

---

## Need to See Your Existing Templates?

Let me know and I can create a script to list all your approved templates!
