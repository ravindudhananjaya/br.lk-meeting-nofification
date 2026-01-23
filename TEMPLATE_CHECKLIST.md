# Meta Business Manager Template Checklist

Use this checklist to verify your WhatsApp templates are configured correctly.

## Template 1: Confirmation Message

### Basic Information
- [ ] Template Name: `meeting_confirmation` (exact match, case-sensitive)
- [ ] Language: **English (US)**
- [ ] Category: **UTILITY** or **TRANSACTIONAL**
- [ ] Status: **APPROVED** ✅ (not "Pending" or "Rejected")

### Template Structure

**Header:** (Optional)
- [ ] None, or simple text header

**Body:** (Required - must have exactly 3 variables)
```
Hi {{1}},

Your appointment is confirmed for {{2}}.

Join here: {{3}}

Thank you for choosing br.lk!
```

- [ ] Contains `{{1}}` for attendee name
- [ ] Contains `{{2}}` for meeting time
- [ ] Contains `{{3}}` for meeting link
- [ ] No extra variables (only 3 total)

**Footer:** (Optional)
- [ ] None, or simple text footer

**Buttons:** (Optional)
- [ ] None, or simple action buttons

---

## Template 2: Reminder Message

### Basic Information
- [ ] Template Name: `meeting_reminder` (exact match, case-sensitive)
- [ ] Language: **English (US)**
- [ ] Category: **UTILITY** or **TRANSACTIONAL**
- [ ] Status: **APPROVED** ✅

### Template Structure

**Header:** (Optional)
- [ ] None, or simple text header

**Body:** (Required - must have exactly 3 variables)
```
Hello {{1}},

Your meeting with br.lk starts in {{2}}.

Join Link: {{3}}

See you soon!
```

- [ ] Contains `{{1}}` for attendee name
- [ ] Contains `{{2}}` for time difference (e.g., "1 hour", "10 mins")
- [ ] Contains `{{3}}` for meeting link
- [ ] No extra variables (only 3 total)

**Footer:** (Optional)
- [ ] None, or simple text footer

**Buttons:** (Optional)
- [ ] None, or simple action buttons

---

## Environment Variables Match

Verify your `.env` file has the correct template names:

```bash
WHATSAPP_TEMPLATE_CONFIRMATION="meeting_confirmation"
WHATSAPP_TEMPLATE_REMINDER="meeting_reminder"
```

- [ ] Template names match exactly (no typos)
- [ ] No extra spaces before or after the names
- [ ] Wrapped in quotes

---

## How to Check in Meta Business Manager

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Click on **WhatsApp Manager** in the left sidebar
3. Click on **Message Templates**
4. Find your templates in the list

### What to Look For:

| Column | What to Check |
|--------|---------------|
| **Name** | Exact match: `meeting_confirmation` or `meeting_reminder` |
| **Status** | Must show **APPROVED** with green checkmark ✅ |
| **Language** | Must be **English (US)** |
| **Category** | Should be **UTILITY** or **TRANSACTIONAL** |

---

## Common Template Issues

### Issue: Template Shows "Pending"
**Solution:** Wait for Meta to approve (usually 24-48 hours). You cannot use pending templates.

### Issue: Template Shows "Rejected"
**Solution:** 
1. Click on the template to see rejection reason
2. Fix the issues mentioned
3. Resubmit for approval

### Issue: Template Has Wrong Number of Variables
**Solution:**
1. Edit the template in Meta Business Manager
2. Ensure body has exactly `{{1}}`, `{{2}}`, `{{3}}`
3. Resubmit for approval

### Issue: Template Name Has Typo
**Solution:**
1. Create a new template with correct name
2. Wait for approval
3. Update `.env` file with correct name
4. Delete old template (optional)

---

## Testing After Verification

Once all checkboxes are checked, run:

```bash
npm run test:whatsapp 94777123456
```

You should receive a WhatsApp message! 📱

---

## Example Template Screenshots

When viewing your template in Meta Business Manager, it should look like:

**Status Column:**
```
✅ APPROVED
```

**Template Preview:**
```
Hi John Doe,

Your appointment is confirmed for 22/01/2026, 10:00:00.

Join here: https://meet.google.com/abc-defg-hij

Thank you for choosing br.lk!
```

The variables `{{1}}`, `{{2}}`, `{{3}}` will be replaced with sample data in the preview.

---

## Need to Create Templates?

If you don't have templates yet:

1. Go to Meta Business Manager → WhatsApp Manager → Message Templates
2. Click **"Create Template"**
3. Fill in:
   - **Name:** `meeting_confirmation`
   - **Category:** UTILITY
   - **Language:** English (US)
4. In the body, use the example text above with `{{1}}`, `{{2}}`, `{{3}}`
5. Click **"Submit"**
6. Wait for approval (24-48 hours)
7. Repeat for `meeting_reminder` template

---

**All checked?** Great! Your templates should work now. 🎉
