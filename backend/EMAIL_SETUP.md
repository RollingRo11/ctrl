# Email Configuration for Tax Documents

The Financial tab now includes real email functionality to send tax documents to CPAs and accountants.

## Current Status

✅ **The email feature is IMPLEMENTED and READY to use**

By default, emails are **simulated** (no actual emails sent). To enable real email sending, follow the setup instructions below.

## How It Works Right Now

1. Click "Email to CPA" button
2. Enter an email address
3. System validates the email and shows success message
4. **Emails are simulated** - no actual email is sent, but all PDFs are generated

## Enable Real Email Sending

### Option 1: Gmail (Easiest for Development)

1. **Use a Gmail account** (create a new one for this app if needed)

2. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup steps

3. **Generate an App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "GPU Datacenter Platform"
   - Copy the 16-character password

4. **Add to .env file**
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

5. **Restart the backend**
   ```bash
   cd backend
   npm start
   ```

### Option 2: SendGrid (Production-Ready)

For production use, SendGrid is recommended:

1. Sign up at https://sendgrid.com
2. Create an API key
3. Install SendGrid SDK:
   ```bash
   npm install @sendgrid/mail
   ```
4. Update `emailService.js` to use SendGrid instead of nodemailer

### Option 3: AWS SES (Enterprise)

For high-volume production use:

1. Set up AWS SES in your AWS account
2. Verify your sending domain
3. Install AWS SDK
4. Update `emailService.js` to use AWS SES

## Testing the Email Feature

### Without Email Credentials (Current State)

1. Go to Financial tab
2. Click "Email to CPA"
3. Enter any email address
4. See success message: "Email simulated - would send to [email]"
5. Check backend console - you'll see:
   ```
   ⚠️  Email credentials not configured. Simulating email send...
   📧 Would send to: cpa@example.com
   📄 Documents: 1099-div, 1099-b, annual-summary
   ```

### With Email Credentials Configured

1. Configure `.env` as shown above
2. Restart backend
3. Click "Email to CPA"
4. Enter YOUR OWN email address (to test)
5. Check your inbox - you should receive:
   - Professional HTML email
   - 3 PDF attachments (1099-DIV, 1099-B, Annual Summary)
   - Summary of your tax information
   - All with your real investment data

## What Gets Sent

The email includes:

📧 **Professional HTML Email**
- Branded header with logo colors
- Summary of tax information
- List of attached documents
- Tax liability breakdown
- Next steps instructions

📄 **PDF Attachments**
- Form 1099-DIV (Dividend Income)
- Form 1099-B (Capital Gains/Losses)
- Annual Tax Summary Report

All documents contain **your actual investment data**:
- Real project names
- Actual cost basis and current values
- Calculated gains/losses
- Tax rates based on holding periods
- Dividend estimates

## Email Template Preview

Subject: `Your 2025 Tax Documents - GPU Datacenter Investments`

```
📊 Your Tax Documents Are Ready

Dear Investor,

Your tax documents for the 2025 tax year are attached to this email.

📄 Included Documents:
• Form 1099-DIV (Dividend Income)
• Form 1099-B (Capital Gains/Losses)
• Annual Tax Summary Report

💰 Summary:
• Total Investment Income: $4,830.00
• Total Dividends: $3,200.00
• Estimated Tax Owed: $1,847.00
• Tax Savings Available: $340.00

Next Steps:
1. Review the attached documents carefully
2. Consult with your tax professional if needed
3. File these with your 2025 tax return

⚠️ Important: These documents are for informational purposes only.
```

## Troubleshooting

### "Email failed to send"

**Check:**
1. `.env` file has correct EMAIL_USER and EMAIL_PASSWORD
2. Gmail App Password is correct (16 characters, no spaces)
3. 2-Factor Authentication is enabled on Gmail
4. Backend was restarted after adding credentials

### "Invalid credentials"

- Make sure you're using an **App Password**, not your regular Gmail password
- App Passwords only work with 2FA enabled

### "Rate limit exceeded"

- Gmail has a sending limit (500 emails/day for free accounts)
- Consider upgrading to SendGrid or AWS SES for production

## Security Notes

⚠️ **Never commit `.env` file to git** - it contains sensitive credentials

✅ **Best Practices:**
- Use app-specific passwords, not account passwords
- Rotate credentials regularly
- Use environment variables in production
- Consider using a dedicated email account for the app
- For production, use SendGrid or AWS SES instead of Gmail

## File Locations

- Email service logic: `/backend/services/emailService.js`
- Email endpoint: `/backend/routes/financial.js` (POST /api/financial/email-documents)
- Frontend handler: `/web/src/pages/Financial.tsx` (handleEmailToCPA function)
