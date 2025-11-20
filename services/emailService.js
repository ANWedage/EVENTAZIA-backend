const sgMail = require('@sendgrid/mail');

/**
 * Email Service - Sends emails using SendGrid HTTP API
 * Using HTTP API instead of SMTP to avoid Render's port restrictions
 */

// Initialize SendGrid API
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API initialized');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not configured - email sending will fail');
}

/**
 * Send OTP email
 */
async function sendOTPEmail(email, otp) {
  try {
    // Development mode - just log the OTP
    if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
      console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log('========================================\n');
      return {
        success: true,
        messageId: 'dev-' + Date.now(),
        provider: 'Development'
      };
    }

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Eventazia - Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0fdf4;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Eventazia</h1>
            <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">Event Management System</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 24px;">Email Verification</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Thank you for registering for Eventazia 2025! To complete your registration, please use the following verification code:
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 3px dashed #16a34a; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
              <p style="color: #065f46; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Your Verification Code</p>
              <p style="color: #16a34a; font-size: 48px; font-weight: bold; margin: 0; letter-spacing: 8px;">${otp}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
              <li>This code is valid for <strong>5 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              Need help? Contact us at ${process.env.SUPPORT_CONTACT || 'support@eventazia.com'}
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
              © 2025 Eventazia. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email. Please do not reply.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Send email using SendGrid HTTP API
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Your Eventazia Verification Code',
      text: `Your Eventazia verification code is: ${otp}\n\nThis code is valid for 5 minutes.\nDo not share this code with anyone.\n\n- Eventazia Team`,
      html: htmlContent,
    };

    const response = await sgMail.send(msg);
    console.log(`✅ OTP email sent to ${email} via SendGrid`);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      provider: 'SendGrid'
    };

  } catch (error) {
    console.error('❌ Email Service Error:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send rejection notification email
 */
async function sendRejectionEmail(email, name, reason) {
  try {
    // Development mode - just log
    if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
      console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
      console.log(`To: ${email}`);
      console.log(`Subject: Eventazia Registration - Payment Issue`);
      console.log(`Reason: ${reason}`);
      console.log('========================================\n');
      return {
        success: true,
        messageId: 'dev-' + Date.now(),
        provider: 'Development'
      };
    }

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Eventazia - Registration Issue</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fef2f2;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Eventazia</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Event Management System</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 24px;">Registration Issue</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear ${name},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We regret to inform you that we couldn't verify your payment for Eventazia 2025. Your registration has been marked as rejected.
            </p>
            
            <!-- Reason Box -->
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
              <p style="color: #7f1d1d; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Reason:</p>
              <p style="color: #991b1b; font-size: 16px; margin: 0;">${reason}</p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              If you believe this is a mistake or if you have already made the payment, please contact our support team immediately with your payment proof.
            </p>
            
            <!-- Contact Box -->
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 25px; border-radius: 12px; text-align: center;">
              <p style="color: #065f46; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Need Help?</p>
              <p style="color: #16a34a; font-size: 18px; margin: 0; font-weight: 600;">${process.env.SUPPORT_CONTACT || 'support@eventazia.com'}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
              © 2025 Eventazia. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email. Please do not reply.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Send email using SendGrid HTTP API
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Eventazia Registration - Payment Issue',
      text: `Dear ${name},\n\nWe regret to inform you that we couldn't verify your payment for Eventazia 2025. Your registration has been marked as rejected.\n\nReason: ${reason}\n\nIf you believe this is a mistake, please contact us at ${process.env.SUPPORT_CONTACT || 'support@eventazia.com'}\n\n- Eventazia Team`,
      html: htmlContent,
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Rejection email sent to ${email} via SendGrid`);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      provider: 'SendGrid'
    };

  } catch (error) {
    console.error('❌ Email Service Error:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send approval notification email with ticket
 */
async function sendApprovalEmail(email, name, ticketData) {
  try {
    // Development mode - just log
    if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
      console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
      console.log(`To: ${email}`);
      console.log(`Subject: Your Eventazia 2025 Ticket is Ready!`);
      console.log(`Ticket ID: ${ticketData.ticketId}`);
      console.log('========================================\n');
      return {
        success: true,
        messageId: 'dev-' + Date.now(),
        provider: 'Development'
      };
    }

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Eventazia - Your Ticket is Ready!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0fdf4;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 Congratulations!</h1>
            <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 18px;">Your Eventazia 2025 Ticket is Ready!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${name}!</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We're thrilled to confirm your registration for Eventazia 2025! Your payment has been verified, and your ticket is attached to this email.
            </p>
            
            <!-- Ticket Info Box -->
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #16a34a; border-radius: 12px; padding: 25px; margin: 0 0 30px 0;">
              <p style="color: #065f46; font-size: 14px; margin: 0 0 15px 0; font-weight: 600;">📋 Your Ticket Details:</p>
              <p style="color: #374151; margin: 0 0 8px 0;"><strong>Ticket ID:</strong> <span style="color: #16a34a; font-weight: bold;">${ticketData.ticketId}</span></p>
              <p style="color: #374151; margin: 0 0 8px 0;"><strong>Name:</strong> ${ticketData.fullName}</p>
              <p style="color: #374151; margin: 0 0 8px 0;"><strong>Email:</strong> ${ticketData.email}</p>
              <p style="color: #374151; margin: 0 0 8px 0;"><strong>Phone:</strong> ${ticketData.phone}</p>
              <p style="color: #374151; margin: 0;"><strong>Ticket Type:</strong> ${ticketData.ticketType}</p>
            </div>
            
            <!-- Important Info -->
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
              <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">⚠️ Important:</p>
              <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Please bring a printout or digital copy of your ticket</li>
                <li>Carry a valid ID for verification</li>
                <li>Arrive 30 minutes before the event starts</li>
                <li>Your ticket is attached to this email</li>
              </ul>
            </div>
            
            <!-- Event Details -->
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📅 Event Details:</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 5px 0;"><strong>Date:</strong> ${ticketData.eventDate || 'TBA'}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 5px 0;"><strong>Time:</strong> ${ticketData.eventTime || 'TBA'}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;"><strong>Venue:</strong> ${ticketData.eventVenue || 'TBA'}</p>
            </div>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              If you have any questions, feel free to contact us at <strong>${process.env.SUPPORT_CONTACT || 'support@eventazia.com'}</strong>
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0; font-weight: 600;">
              See you at the event! 🎊
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
              © 2025 Eventazia. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email. Please do not reply.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Prepare attachments if ticket image is provided
    const attachments = [];
    if (ticketData.ticketImage && ticketData.ticketImage.data) {
      // Convert Buffer to base64 if needed
      let base64Data;
      if (Buffer.isBuffer(ticketData.ticketImage.data)) {
        base64Data = ticketData.ticketImage.data.toString('base64');
      } else {
        base64Data = ticketData.ticketImage.data;
      }

      attachments.push({
        content: base64Data,
        filename: `Eventazia_Ticket_${ticketData.ticketId}.png`,
        type: 'image/png',
        disposition: 'attachment'
      });
    }

    // Send email using SendGrid HTTP API
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: '🎉 Your Eventazia 2025 Ticket is Ready!',
      text: `Congratulations ${name}!\n\nYour payment has been verified and your ticket for Eventazia 2025 is ready!\n\nTicket ID: ${ticketData.ticketId}\n\nPlease find your ticket attached to this email. Bring it along with a valid ID to the event.\n\nSee you there!\n- Eventazia Team`,
      html: htmlContent,
      attachments: attachments
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Approval email with ticket sent to ${email} via SendGrid`);

    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      provider: 'SendGrid'
    };

  } catch (error) {
    console.error('❌ Email Service Error:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendOTPEmail,
  sendRejectionEmail,
  sendApprovalEmail
};
