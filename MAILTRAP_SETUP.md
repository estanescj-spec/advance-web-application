# Mailtrap Setup Guide

## What is Mailtrap?

Mailtrap is an email delivery platform that allows you to test and send emails during development without affecting real users. Perfect for development and staging environments.

## Setup Steps

### Step 1: Create Mailtrap Account

1. Go to [mailtrap.io](https://mailtrap.io)
2. Click **Sign up** and create a free account
3. Verify your email address

### Step 2: Create an Inbox

1. Log in to Mailtrap dashboard
2. Go to **Email Testing** → **Inboxes**
3. Click **Create Inbox** and name it (e.g., "MacSphere Development")
4. Click **Create**

### Step 3: Get SMTP Credentials

1. In your newly created inbox, click **Settings**
2. Select **Integrations** tab
3. Choose **Node.js** from the dropdown
4. Copy the SMTP credentials:
   - **SMTP Host**: `sandbox.smtp.mailtrap.io`
   - **SMTP Port**: `2525`
   - **Username**: Your unique ID (e.g., `7228d32baf338c`)
   - **Password**: Your unique password (e.g., `938517bf73b42c`)

### Step 4: Configure Environment Variables

Create or update `backend/.env` file with:

```env
# Mailtrap Configuration
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_EMAIL=your_username_here
SMTP_PASSWORD=your_password_here
SMTP_FROM_EMAIL=your-app@yourdomain.com
SMTP_FROM_NAME=Your App Name
```

**Example:**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_EMAIL=7228d32baf338c
SMTP_PASSWORD=938517bf73b42c
SMTP_FROM_EMAIL=macsphere-admin@macsphere.com
SMTP_FROM_NAME=MacSphere
```

### Step 5: Restart Backend Server

```bash
cd backend
npm start
```

## Testing Email

### Method 1: Test via API

Send a test request to trigger an email:

```bash
curl -X POST http://localhost:3000/api/v1/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Method 2: Create an Order

1. Sign in to the application
2. Place an order
3. Check Mailtrap inbox for order confirmation email

### Method 3: Direct Test (Node.js)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '7228d32baf338c',
    pass: '938517bf73b42c'
  }
});

transporter.sendMail({
  from: 'macsphere-admin@macsphere.com',
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test</h1>'
}, (err, info) => {
  if (err) console.log(err);
  else console.log('Email sent:', info.response);
});
```

## Viewing Sent Emails in Mailtrap

1. Log in to Mailtrap dashboard
2. Open your inbox
3. All sent test emails appear in the email list
4. Click any email to view:
   - Subject
   - From/To addresses
   - HTML & plain text content
   - Headers
   - Attachments (if any)

## Integration Points

### Order Emails
Emails are automatically sent when:
- Order is placed (checkout)
- Order status changes to "completed"
- Order is cancelled

### Email Templates
Email templates are generated in:
- `backend/utils/orderReceipt.js` - Builds HTML email with order details

### Email Service
Emails are sent via:
- `backend/utils/sendEmail.js` - Nodemailer configuration

## Troubleshooting

### Emails Not Sending?

1. **Check credentials** in `backend/.env`:
   ```bash
   echo $env:SMTP_EMAIL
   echo $env:SMTP_PASSWORD
   ```

2. **Check server logs** for error messages:
   ```bash
   npm start  # Look for error output
   ```

3. **Verify Mailtrap account** is active and inbox exists

4. **Check firewall** - Port 2525 should be accessible

5. **Test connection**:
   ```javascript
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     secure: false,
     auth: {
       user: process.env.SMTP_EMAIL,
       pass: process.env.SMTP_PASSWORD
     }
   });

   transporter.verify((error, success) => {
     if (error) console.log(error);
     else console.log('✓ Connection ready');
   });
   ```

### Port Already in Use?

If port 2525 is blocked:
- Try port **465** (secure) or **587** (TLS)
- Update `SMTP_PORT` in `.env`
- Update `secure` flag in `sendEmail.js`:
  ```javascript
  secure: process.env.SMTP_PORT == 465  // true for 465, false for 2525/587
  ```

## For Production (Optional)

When deploying to production:

1. **Switch to production email service**:
   - SendGrid
   - AWS SES
   - Mailgun
   - Custom SMTP server

2. **Update `.env`**:
   ```env
   SMTP_HOST=production.smtp.service.com
   SMTP_PORT=587
   SMTP_EMAIL=production_email
   SMTP_PASSWORD=production_password
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   SMTP_FROM_NAME=Your Company
   ```

3. **Code doesn't change** - Same `sendEmail.js` works with any SMTP provider

## Features Included

✅ Order confirmation emails  
✅ Order completion notifications  
✅ Order cancellation alerts  
✅ HTML formatted emails with branding  
✅ PDF receipt attachments  
✅ Customer details in email  
✅ Product information in email  


