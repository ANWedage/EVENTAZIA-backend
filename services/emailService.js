const nodemailer = require('nodemailer');

/**
 * Email Service - Sends emails using Nodemailer
 */

// Create email transporter
function createTransporter() {
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    // Development mode - log email instead of sending
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/**
 * Send OTP email
 */
async function sendOTPEmail(email, otp) {
  try {
    const transporter = createTransporter();

    // Development mode - just log
    if (!transporter) {
      console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
      console.log(`To: ${email}`);
      console.log(`Subject: Your Eventazia Verification Code`);
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

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Your Eventazia Verification Code',
      text: `Your Eventazia verification code is: ${otp}\n\nThis code is valid for 5 minutes.\nDo not share this code with anyone.\n\n- Eventazia Team`,
      html: htmlContent,
    });

    console.log(`✅ OTP email sent to ${email}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      provider: 'Nodemailer'
    };

  } catch (error) {
    console.error('❌ Email Service Error:', error);
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
    const transporter = createTransporter();

    // Development mode - just log
    if (!transporter) {
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
        <title>Eventazia - Registration Update</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fef2f2;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Eventazia</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Event Management System</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 24px;">Registration Update</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear ${name},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Thank you for your interest in Eventazia 2025. We regret to inform you that your registration has not been approved due to a payment verification issue.
            </p>
            
            <!-- Reason Box -->
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
              <p style="color: #991b1b; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Reason:</p>
              <p style="color: #7f1d1d; font-size: 14px; margin: 0; line-height: 1.6;">${reason || 'Payment verification failed. Please ensure your bank slip shows the correct amount (Rs. 3,000) and transaction details.'}</p>
            </div>
            
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
              <p style="color: #065f46; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">What you can do:</p>
              <ul style="color: #166534; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Verify your payment was completed successfully</li>
                <li>Ensure you transferred Rs. 3,000 to the correct account</li>
                <li>Take a clear photo of your bank slip showing all transaction details</li>
                <li>Register again with the correct payment proof</li>
              </ul>
            </div>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              If you believe this was a mistake or need assistance, please contact us at ${process.env.SUPPORT_CONTACT || 'support@eventazia.com'}
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              We look forward to welcoming you at Eventazia 2025!
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

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Eventazia Registration - Payment Verification Issue',
      text: `Dear ${name},\n\nYour registration for Eventazia 2025 has not been approved due to a payment verification issue.\n\nReason: ${reason || 'Payment verification failed.'}\n\nPlease verify your payment and register again with correct payment proof.\n\nFor assistance, contact: support@eventazia.com\n\n- Eventazia Team`,
      html: htmlContent,
    });

    console.log(`✅ Rejection email sent to ${email}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      provider: 'Nodemailer'
    };

  } catch (error) {
    console.error('❌ Email Service Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send Approval Email with Banner Attachment
 */
async function sendApprovalEmail(registration, eventDetails, bannerBuffer) {
  const { name, email, ticketId, ticketPrice, createdAt } = registration;
  
  try {
    const transporter = createTransporter();

    // Development mode - just log
    if (!transporter) {
      console.log('\n📧 ========== APPROVAL EMAIL (DEV MODE) ==========');
      console.log(`To: ${email}`);
      console.log(`Subject: Ticket Approved - ${ticketId}`);
      console.log(`Name: ${name}`);
      console.log(`Ticket ID: ${ticketId}`);
      console.log(`Amount: Rs ${ticketPrice}`);
      console.log('Banner: ' + (bannerBuffer ? 'Attached' : 'Not available'));
      console.log('================================================\n');
      return {
        success: true,
        messageId: 'dev-' + Date.now(),
        provider: 'Development'
      };
    }

    // Format dates
    const submittedDate = new Date(createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const eventDate = eventDetails?.date || 'December 15, 2025';
    const eventTime = eventDetails?.time || '6:00 PM - 11:00 PM';
    const eventVenue = eventDetails?.venue || 'Grand Ballroom';

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Eventazia - Ticket Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0fdf4;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 Congratulations!</h1>
            <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">Your ticket has been approved</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 24px;">Payment Verified</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Dear <strong>${name}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We are pleased to inform you that your payment has been successfully verified and your registration for <strong>Eventazia 2025</strong> has been approved!
            </p>
            
            <!-- Ticket ID Box -->
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 3px solid #16a34a; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
              <p style="color: #065f46; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">YOUR TICKET ID</p>
              <p style="color: #16a34a; font-size: 42px; font-weight: bold; margin: 0; letter-spacing: 4px; font-family: 'Courier New', monospace;">${ticketId}</p>
              <p style="color: #059669; font-size: 12px; margin: 10px 0 0 0;">Please save this ID for event check-in</p>
            </div>
            
            <!-- Payment Details -->
            <div style="background: #f9fafb; border-radius: 12px; padding: 25px; margin: 0 0 30px 0;">
              <h3 style="color: #065f46; font-size: 18px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #d1d5db;">Payment Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Ticket Holder:</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Email:</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Amount Paid:</td>
                  <td style="padding: 10px 0; color: #16a34a; font-size: 16px; font-weight: 700; text-align: right;">Rs ${ticketPrice.toLocaleString('en-US')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Submitted:</td>
                  <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${submittedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                  <td style="padding: 10px 0; text-align: right;">
                    <span style="background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">✓ VERIFIED</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Event Details -->
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 25px; margin: 0 0 30px 0;">
              <h3 style="color: #92400e; font-size: 18px; margin: 0 0 20px 0;">📅 Event Information</h3>
              
              <div style="margin-bottom: 15px;">
                <p style="color: #78350f; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 600;">Date</p>
                <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: 700;">${eventDate}</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <p style="color: #78350f; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 600;">Time</p>
                <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: 700;">${eventTime}</p>
              </div>
              
              <div>
                <p style="color: #78350f; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 600;">Venue</p>
                <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: 700;">${eventVenue}</p>
              </div>
            </div>
            
            <!-- Important Notes -->
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
              <p style="color: #1e40af; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">📌 Important Notes:</p>
              <ul style="color: #1e3a8a; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Please bring your <strong>Ticket ID (${ticketId})</strong> for check-in</li>
                <li>Your event banner/ticket design is attached to this email</li>
                <li>Arrive 30 minutes before the event starts</li>
                <li>Bring a valid ID for verification</li>
                <li>This ticket is non-transferable and non-refundable</li>
              </ul>
            </div>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
              We look forward to seeing you at <strong>Eventazia 2025</strong>!
            </p>
            
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
              For any questions, contact us at <strong>0768833626 (Adeepa Wedage)</strong>
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

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `🎉 Ticket Approved - ${ticketId} | Eventazia 2025`,
      text: `Dear ${name},\n\nCongratulations! Your registration for Eventazia 2025 has been approved.\n\nTicket ID: ${ticketId}\nAmount Paid: Rs ${ticketPrice}\nPayment Status: VERIFIED\n\nEvent Details:\nDate: ${eventDate}\nTime: ${eventTime}\nVenue: ${eventVenue}\n\nPlease save your Ticket ID (${ticketId}) for event check-in.\n\nSee you at the event!\n\n- Eventazia Team`,
      html: htmlContent,
      attachments: []
    };

    // Add banner image as attachment if available
    if (bannerBuffer && bannerBuffer.data) {
      mailOptions.attachments.push({
        filename: `Eventazia_2025_Ticket_${name.replace(/\s+/g, '_')}.jpg`,
        content: bannerBuffer.data,
        contentType: bannerBuffer.mimetype || 'image/jpeg',
        cid: 'eventBanner'
      });
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Approval email sent to ${email} (Ticket: ${ticketId}): ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      provider: 'Nodemailer',
      ticketId: ticketId
    };

  } catch (error) {
    console.error('❌ Approval Email Service Error:', error);
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
