# Eventazia Backend - Email OTP System

Backend API for Eventazia event management with email-based OTP verification.

## Features

- ✅ Email OTP generation and sending
- ✅ OTP verification with attempt limiting
- ✅ Rate limiting (max 3 OTPs per 15 minutes)
- ✅ 5-minute OTP expiry
- ✅ Beautiful HTML email templates
- ✅ Development mode (logs emails instead of sending)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend folder:

```bash
cp .env.example .env
```

### 3. Email Configuration

#### Option A: Using Gmail (Recommended for Testing)

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. Update `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
EMAIL_FROM="Eventazia <your_email@gmail.com>"
```

#### Option B: Using SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Install SendGrid package: `npm install @sendgrid/mail`
4. Update emailService.js to use SendGrid

### 4. Start the Server

**Development mode** (logs emails to console):
```bash
npm run dev
```

**Production mode** (sends real emails):
```bash
NODE_ENV=production npm start
```

## API Endpoints

### Send OTP
```
POST http://localhost:3001/api/send-email-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Verify OTP
```
POST http://localhost:3001/api/verify-email-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "1234"
}
```

### Health Check
```
GET http://localhost:3001/api/health
```

## Testing

### Development Mode
In development mode (without EMAIL_USER configured), the system will:
- Log OTP codes to console
- Not send actual emails
- Perfect for testing without email setup

### With Real Email
Once configured with Gmail or SendGrid:
- Real emails will be sent
- Check your inbox/spam folder
- OTP expires in 5 minutes

## Security Features

- **Rate Limiting**: Max 3 OTP requests per 15 minutes per email
- **OTP Expiry**: Codes expire after 5 minutes
- **Attempt Limiting**: Max 3 verification attempts per OTP
- **CORS Protection**: Only allows requests from frontend URL
- **Input Validation**: Email format and OTP format validation

## Production Recommendations

1. **Use Redis** instead of Map for OTP storage
2. **Add Authentication** for admin endpoints
3. **Use SendGrid or AWS SES** for reliable email delivery
4. **Enable HTTPS** in production
5. **Add Logging** with Winston or similar
6. **Add Monitoring** with tools like Sentry
7. **Use Environment-specific configs**

## Troubleshooting

### Emails not sending
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify Gmail App Password is correct
- Check spam/junk folder
- Review console logs for errors

### Port already in use
Change PORT in .env file:
```env
PORT=3002
```

### CORS errors
Update FRONTEND_URL in .env:
```env
FRONTEND_URL=http://localhost:5175
```

## Support

For issues or questions, contact: support@eventazia.com
