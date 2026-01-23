# 🔍 Finding Your WhatsApp Templates

## The Issue

The error message clearly states:
```
Template name (meeting_confirmation) does not exist in en_US
```

This means you need to **create the templates** in Meta Business Manager.

---

## ✅ Solution: Create Templates in Meta Business Manager

### Step 1: Access Meta Business Manager

1. Go to: **https://business.facebook.com/**
2. Log in with your Facebook account
3. Select your business account

### Step 2: Navigate to Message Templates

1. Click **"WhatsApp Manager"** in the left sidebar
2. Click **"Message Templates"** in the submenu
3. You'll see a list of all your templates (if any exist)

### Step 3: Check If Templates Exist

Look for these template names:
- `meeting_confirmation`
- `meeting_reminder`

**If they exist:**
- Check their **Status** column
- Must be **APPROVED** (green checkmark ✅)
- If **PENDING** ⏳ - wait for approval (24-48 hours)
- If **REJECTED** ❌ - fix issues and resubmit

**If they don't exist:**
- Continue to Step 4 to create them

---

## Step 4: Create "meeting_confirmation" Template

### Click "Create Template" Button

### Fill in Basic Information:

**Template Name:**
```
meeting_confirmation
```
(Copy exactly - no spaces, all lowercase)

**Category:**
- Select: **UTILITY**

**Languages:**
- Select: **English (US)** 
- ⚠️ Important: Must be "English (US)", not just "English"

### Add Template Content:

**Header:** (Optional - you can skip this)

**Body:** (Required - paste this exactly)
```
Hi {{1}},

Your appointment with br.lk is confirmed for {{2}}.

Meeting Link: {{3}}

Thank you for choosing br.lk. See you soon!
```

**Sample Values** (for preview):
- {{1}}: `John Doe`
- {{2}}: `22/01/2026, 10:00:00`
- {{3}}: `https://meet.google.com/abc-defg-hij`

**Footer:** (Optional - you can skip this)

**Buttons:** (Optional - you can skip this)

### Submit for Approval

1. Click **"Submit"**
2. Wait for Meta to review (usually 24-48 hours)
3. You'll receive an email when approved

---

## Step 5: Create "meeting_reminder" Template

Repeat the same process with these details:

**Template Name:**
```
meeting_reminder
```

**Category:**
- Select: **UTILITY**

**Languages:**
- Select: **English (US)**

**Body:**
```
Hello {{1}},

This is a reminder that your meeting with br.lk starts in {{2}}.

Join Link: {{3}}

See you soon!
```

**Sample Values:**
- {{1}}: `John Doe`
- {{2}}: `1 hour` (or `10 mins`)
- {{3}}: `https://meet.google.com/abc-defg-hij`

Submit for approval.

---

## Step 6: Wait for Approval

- Meta usually approves templates within **24-48 hours**
- You'll receive an **email notification** when approved
- Check status in WhatsApp Manager → Message Templates

---

## Step 7: Test Again After Approval

Once both templates show **APPROVED** status:

```bash
npm run test:whatsapp 94777895327
```

You should receive a WhatsApp message! 📱

---

## 📸 Visual Guide

### What the Template Creation Form Looks Like:

```
┌─────────────────────────────────────┐
│ Create Message Template             │
├─────────────────────────────────────┤
│ Template name:                      │
│ [meeting_confirmation]              │
│                                     │
│ Category:                           │
│ [UTILITY ▼]                         │
│                                     │
│ Languages:                          │
│ [English (US) ▼]                    │
│                                     │
│ Body:                               │
│ ┌─────────────────────────────────┐ │
│ │ Hi {{1}},                       │ │
│ │                                 │ │
│ │ Your appointment with br.lk is  │ │
│ │ confirmed for {{2}}.            │ │
│ │                                 │ │
│ │ Meeting Link: {{3}}             │ │
│ │                                 │ │
│ │ Thank you for choosing br.lk.   │ │
│ │ See you soon!                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]              [Submit]      │
└─────────────────────────────────────┘
```

---

## ⚠️ Common Mistakes to Avoid

❌ **Wrong:** Template name with spaces: `meeting confirmation`  
✅ **Correct:** `meeting_confirmation`

❌ **Wrong:** Language set to "English" or "English (UK)"  
✅ **Correct:** Language set to "English (US)"

❌ **Wrong:** Category set to "MARKETING"  
✅ **Correct:** Category set to "UTILITY"

❌ **Wrong:** Different number of variables (2 or 4)  
✅ **Correct:** Exactly 3 variables: `{{1}}`, `{{2}}`, `{{3}}`

---

## 🆘 Can't Access Meta Business Manager?

If you don't have access:

1. **Ask your admin** to create the templates
2. **Or** request access to WhatsApp Manager
3. **Or** provide me with someone who has access

---

## 📋 Quick Checklist

Before testing again, ensure:

- [ ] Both templates created (`meeting_confirmation` and `meeting_reminder`)
- [ ] Both templates have status: **APPROVED** ✅
- [ ] Both templates use language: **English (US)**
- [ ] Both templates have exactly **3 variables** (`{{1}}`, `{{2}}`, `{{3}}`)
- [ ] Template names match exactly (no typos, no spaces)

---

## 🎯 Next Steps

1. **Create the templates** in Meta Business Manager
2. **Wait for approval** (24-48 hours)
3. **Test again** with: `npm run test:whatsapp 94777895327`

Once approved, your WhatsApp notifications will work! 🎉
