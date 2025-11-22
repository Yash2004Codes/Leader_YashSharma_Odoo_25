# Email Setup for Password Reset

## 🔧 Setting Up SMTP for OTP Emails

The password reset feature requires SMTP configuration to send OTP codes via email.

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env.local`**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
```

### Option 2: Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
FROM_EMAIL=your-email@outlook.com
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=your-verified-email@domain.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
FROM_EMAIL=your-verified-email@domain.com
```

### Option 3: Development Mode (No Email)

If SMTP is not configured, the OTP will be logged to the console:
- Check your terminal/server logs
- Look for: `⚠️  SMTP not configured. OTP for email@example.com: 123456`

## ✅ Testing

1. Add SMTP configuration to `.env.local`
2. Restart your dev server: `npm run dev`
3. Go to Forgot Password page
4. Enter your registered email
5. Check your email inbox (and spam folder)
6. Use the OTP to reset your password

## 🐛 Troubleshooting

**"OTP not received"**
- Check server console for OTP (if SMTP not configured)
- Verify SMTP credentials in `.env.local`
- Check spam/junk folder
- Verify email address is correct
- Check server logs for email errors

**"SMTP connection failed"**
- Verify SMTP_HOST and SMTP_PORT are correct
- Check firewall/network settings
- For Gmail: Make sure you're using App Password, not regular password
- Try port 465 with `secure: true` for SSL

**"Authentication failed"**
- Double-check SMTP_USER and SMTP_PASS
- For Gmail: Ensure 2FA is enabled and using App Password
- Verify FROM_EMAIL matches SMTP_USER

## 📝 Security Notes

- Never commit `.env.local` to git
- Use App Passwords, not your main password
- In production, use a dedicated email service (SendGrid, Mailgun, etc.)
- Consider rate limiting OTP requests
- OTP expires in 10 minutes (configurable via OTP_EXPIRES_IN)

