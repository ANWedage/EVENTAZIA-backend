const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../services/emailService');
const TicketRegistration = require('../models/TicketRegistration');

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();
// Store verified emails to prevent re-registration
const verifiedEmails = new Map();

// Generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST /api/send-email-otp
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email address format' 
      });
    }

    // Check if email already has a registration in database
    const existingRegistration = await TicketRegistration.findOne({ email: email.toLowerCase() });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'This email has already been registered. Each email can only register once.',
        alreadyRegistered: true
      });
    }

    // Check rate limiting (max 3 OTPs per 15 minutes per email)
    const existingOTP = otpStore.get(email);
    if (existingOTP && existingOTP.requestCount >= 3) {
      const timeSinceFirst = Date.now() - existingOTP.firstRequestTime;
      if (timeSinceFirst < 15 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please try again in 15 minutes.'
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    
    // Store OTP
    const otpData = {
      otp: otp,
      timestamp: Date.now(),
      attempts: 0,
      requestCount: (existingOTP?.requestCount || 0) + 1,
      firstRequestTime: existingOTP?.firstRequestTime || Date.now()
    };
    otpStore.set(email, otpData);

    // Clear OTP after expiry
    setTimeout(() => {
      const current = otpStore.get(email);
      if (current && current.timestamp === otpData.timestamp) {
        otpStore.delete(email);
      }
    }, expiryMinutes * 60 * 1000);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    console.log(`✅ OTP sent to ${email}: ${otp} (Expires in ${expiryMinutes} min)`);

    res.json({ 
      success: true,
      message: 'OTP sent successfully to your email address',
      expiresIn: expiryMinutes * 60, // seconds
      emailMasked: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email
    });

  } catch (error) {
    console.error('❌ Error sending email OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/verify-email-otp
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    // Check if OTP exists
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP not found or has expired. Please request a new one.' 
      });
    }

    // Check if OTP is expired
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    const otpAge = Date.now() - storedData.timestamp;
    if (otpAge > expiryMinutes * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check max attempts
    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
    if (storedData.attempts >= maxAttempts) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts++;
      const remainingAttempts = maxAttempts - storedData.attempts;
      
      return res.status(400).json({ 
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
      });
    }

    // OTP verified successfully - check one more time if registration exists
    const existingRegistration = await TicketRegistration.findOne({ email: email.toLowerCase() });
    if (existingRegistration) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'This email has already been registered.',
        alreadyRegistered: true
      });
    }
    
    // Mark email as verified (valid for 10 minutes)
    verifiedEmails.set(email.toLowerCase(), {
      verifiedAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    });
    
    // Clean up verified email after 10 minutes
    setTimeout(() => {
      verifiedEmails.delete(email.toLowerCase());
    }, 10 * 60 * 1000);
    
    otpStore.delete(email);
    
    console.log(`✅ OTP verified successfully for ${email}`);
    
    res.json({ 
      success: true,
      message: 'Email verified successfully',
      email: email
    });

  } catch (error) {
    console.error('❌ Error verifying email OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to check if email is verified and not expired
function isEmailVerified(email) {
  const normalizedEmail = email.toLowerCase();
  const verifiedData = verifiedEmails.get(normalizedEmail);
  
  if (!verifiedData) {
    return false;
  }
  
  // Check if verification has expired
  if (Date.now() > verifiedData.expiresAt) {
    verifiedEmails.delete(normalizedEmail);
    return false;
  }
  
  return true;
}

// Export verifiedEmails and helper function for use in other routes
module.exports = router;
module.exports.verifiedEmails = verifiedEmails;
module.exports.isEmailVerified = isEmailVerified;
