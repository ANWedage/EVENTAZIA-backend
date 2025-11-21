const express = require('express');
const router = express.Router();
const multer = require('multer');
const TicketRegistration = require('../models/TicketRegistration');
const { verifiedEmails, isEmailVerified } = require('./emailOTP');
const { sendRejectionEmail } = require('../services/emailService');

// Configure multer for file upload (memory storage - files stored in database)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * POST /api/ticket-registrations
 * Create a new ticket registration
 */
router.post('/ticket-registrations', upload.single('bankSlip'), async (req, res) => {
  try {
    const { name, contactNo, email, additionalDescription } = req.body;

    // Validate required fields
    if (!name || !contactNo || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact number, and email are required'
      });
    }

    // Check if email was verified via OTP
    if (!isEmailVerified(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified or verification expired. Please verify your email first.',
        requiresVerification: true
      });
    }

    // Check if email already has a registration
    const existingRegistration = await TicketRegistration.findOne({ email: email.toLowerCase() });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'This email has already been registered. Each email can only register once.',
        alreadyRegistered: true
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Bank slip is required'
      });
    }

    // Create registration with file stored as binary data in database
    const registration = new TicketRegistration({
      name,
      contactNo,
      email: email.toLowerCase(), // Normalize email
      additionalDescription: additionalDescription || null,
      ticketPrice: 3000, // Fixed price
      bankSlip: {
        data: req.file.buffer, // Store file buffer directly in MongoDB
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

    await registration.save();

    // Remove email from verified emails list after successful registration
    verifiedEmails.delete(email.toLowerCase());

    console.log(`✅ New ticket registration: ${email} (Bank slip: ${req.file.originalname}, ${(req.file.size / 1024).toFixed(2)} KB)`);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! We will verify your payment and send confirmation within 24 hours.',
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        status: registration.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating ticket registration:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to submit registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ticket-registrations
 * Get all registrations (with optional status filter)
 */
router.get('/ticket-registrations', async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = status ? { status } : {};
    const registrations = await TicketRegistration.find(filter)
      .sort({ createdAt: -1 })
      .select('-bankSlip.data'); // Don't return binary data in list (only metadata)

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });

  } catch (error) {
    console.error('❌ Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ticket-registrations/stats
 * Get registration statistics
 */
router.get('/ticket-registrations/stats', async (req, res) => {
  try {
    const stats = await TicketRegistration.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ticket-registrations/notifications
 * Get all registrations with additional descriptions (notifications)
 * IMPORTANT: Must be before /:id route to avoid route collision
 */
router.get('/ticket-registrations/notifications', async (req, res) => {
  try {
    const { username } = req.query;

    // Find all registrations with additional descriptions
    const notifications = await TicketRegistration.find({
      additionalDescription: { $exists: true, $ne: null, $ne: '' }
    })
    .select('name email additionalDescription descriptionReadBy createdAt status')
    .sort({ createdAt: -1 });

    // Additional filter to ensure only valid descriptions are shown
    const validNotifications = notifications.filter(
      notif => notif.additionalDescription && notif.additionalDescription.trim() !== ''
    );

    // Filter unread notifications for this admin
    const unreadNotifications = validNotifications.filter(
      notif => !notif.descriptionReadBy.includes(username || 'Admin')
    );

    res.json({
      success: true,
      data: {
        all: validNotifications,
        unread: unreadNotifications,
        unreadCount: unreadNotifications.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/ticket-registrations/:id/mark-read
 * Mark a notification as read by admin
 */
router.put('/ticket-registrations/:id/mark-read', async (req, res) => {
  try {
    const { username } = req.body;

    const registration = await TicketRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Add username to descriptionReadBy if not already there
    if (!registration.descriptionReadBy.includes(username || 'Admin')) {
      registration.descriptionReadBy.push(username || 'Admin');
      await registration.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/ticket-registrations/:id/notification
 * Delete additional description (notification) from registration
 */
router.delete('/ticket-registrations/:id/notification', async (req, res) => {
  try {
    const registration = await TicketRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Clear the additional description
    registration.additionalDescription = null;
    registration.descriptionReadBy = [];
    await registration.save();

    console.log(`🗑️  Notification deleted for registration: ${registration.email}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ticket-registrations/:id
 * Get a single registration
 */
router.get('/ticket-registrations/:id', async (req, res) => {
  try {
    const registration = await TicketRegistration.findById(req.params.id)
      .select('-bankSlip.data'); // Don't return binary data (only metadata)

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: registration
    });

  } catch (error) {
    console.error('❌ Error fetching registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ticket-registrations/:id/download-slip
 * Download bank slip for a registration (from database)
 */
router.get('/ticket-registrations/:id/download-slip', async (req, res) => {
  try {
    const registration = await TicketRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (!registration.bankSlip || !registration.bankSlip.data) {
      return res.status(404).json({
        success: false,
        message: 'Bank slip not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', registration.bankSlip.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${registration.bankSlip.originalName}"`);
    res.setHeader('Content-Length', registration.bankSlip.size);

    // Send binary data directly from database
    res.send(registration.bankSlip.data);

    console.log(`📥 Downloaded bank slip: ${registration.bankSlip.originalName} for ${registration.email}`);

  } catch (error) {
    console.error('❌ Error downloading bank slip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download bank slip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/ticket-registrations/:id/approve
 * Approve a registration, generate ticket ID, and send approval email
 */
router.put('/ticket-registrations/:id/approve', async (req, res) => {
  try {
    const { reviewedBy } = req.body;

    // Find registration first
    const registration = await TicketRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Generate unique ticket ID
    let ticketId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      ticketId = registration.generateTicketId();
      const existing = await TicketRegistration.findOne({ ticketId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique ticket ID');
    }

    // Update registration with approval and ticket ID
    registration.status = 'approved';
    registration.ticketId = ticketId;
    registration.reviewedBy = reviewedBy || 'Admin';
    registration.reviewedAt = new Date();
    await registration.save();

    // Get event details and banner for email
    const EventDetails = require('../models/EventDetails');
    const eventDetails = await EventDetails.findOne();

    // Prepare banner attachment if it exists
    let bannerAttachment = null;
    if (eventDetails?.bannerImage?.data) {
      bannerAttachment = {
        content: eventDetails.bannerImage.data,
        filename: 'event-banner.jpg',
        type: eventDetails.bannerImage.mimetype || 'image/jpeg',
        disposition: 'inline',
        content_id: 'eventBanner'
      };
    }

    // Send approval email
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendApprovalEmail(
      registration.email,
      registration.name,
      {
        ticketId: registration.ticketId,
        fullName: registration.name,
        email: registration.email,
        phone: registration.contactNo,
        ticketType: 'General Admission',
        ticketPrice: 'Rs. 3,000.00',
        eventDate: eventDetails?.date || 'TBA',
        eventTime: eventDetails?.time || 'TBA',
        eventVenue: eventDetails?.venue || 'TBA',
        ticketImage: bannerAttachment
      }
    );

    if (!emailResult.success) {
      console.warn(`⚠️  Registration approved but email failed: ${emailResult.error}`);
    }

    console.log(`✅ Registration approved: ${registration.email} (Ticket: ${ticketId}) by ${reviewedBy || 'Admin'}`);

    res.json({
      success: true,
      message: 'Registration approved successfully. Approval email sent to user.',
      data: {
        id: registration._id,
        name: registration.name,
        email: registration.email,
        ticketId: registration.ticketId,
        status: registration.status,
        reviewedBy: registration.reviewedBy,
        reviewedAt: registration.reviewedAt,
        emailSent: emailResult.success
      }
    });

  } catch (error) {
    console.error('❌ Error approving registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/ticket-registrations/:id/reject
 * Reject a registration, send email, and delete from database
 */
router.put('/ticket-registrations/:id/reject', async (req, res) => {
  try {
    const { reviewedBy, reason } = req.body;

    // Find registration first
    const registration = await TicketRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Store details before deletion
    const email = registration.email;
    const name = registration.name;
    const rejectionReason = reason || 'Payment verification failed. Please ensure your bank slip shows the correct amount (Rs. 3,000) and transaction details are visible.';

    console.log(`❌ Registration rejected: ${email} by ${reviewedBy || 'Admin'} - Reason: ${rejectionReason}`);

    // Send rejection email
    try {
      const emailResult = await sendRejectionEmail(email, name, rejectionReason);
      if (emailResult.success) {
        console.log(`📧 Rejection email sent to ${email}`);
      } else {
        console.error(`⚠️  Failed to send rejection email to ${email}: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.error(`⚠️  Error sending rejection email:`, emailError);
      // Continue with deletion even if email fails
    }

    // Delete registration from database
    await TicketRegistration.findByIdAndDelete(req.params.id);

    console.log(`🗑️  Registration deleted from database: ${email}`);

    res.json({
      success: true,
      message: 'Registration rejected, email sent, and removed from system',
      data: {
        email: email,
        name: name,
        reason: rejectionReason,
        emailSent: true
      }
    });

  } catch (error) {
    console.error('❌ Error rejecting registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/ticket-registrations/:id
 * Delete a registration (optional - for cleanup)
 */
router.delete('/ticket-registrations/:id', async (req, res) => {
  try {
    const registration = await TicketRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Delete the registration (file data is stored in database, will be deleted automatically)
    await TicketRegistration.findByIdAndDelete(req.params.id);

    console.log(`🗑️  Registration deleted: ${registration.email}`);

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
