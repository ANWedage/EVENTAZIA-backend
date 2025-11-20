const express = require('express');
const router = express.Router();
const multer = require('multer');
const EventDetails = require('../models/EventDetails');

// Configure multer for banner image upload (memory storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG and PNG images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * GET /api/event-details
 * Fetch current event details
 */
router.get('/event-details', async (req, res) => {
  try {
    const details = await EventDetails.getDetails();
    
    res.json({
      success: true,
      data: {
        date: details.date,
        time: details.time,
        venue: details.venue,
        updatedAt: details.updatedAt,
        updatedBy: details.updatedBy
      }
    });
  } catch (error) {
    console.error('❌ Error fetching event details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/event-details
 * Update event details
 */
router.put('/event-details', async (req, res) => {
  try {
    const { date, time, venue, updatedBy } = req.body;

    // Validate input
    if (!date || !time || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Date, time, and venue are required'
      });
    }

    // Update details
    const details = await EventDetails.updateDetails(
      { date, time, venue },
      updatedBy || 'Admin'
    );

    console.log(`✅ Event details updated by ${updatedBy || 'Admin'}`);

    res.json({
      success: true,
      message: 'Event details updated successfully',
      data: {
        date: details.date,
        time: details.time,
        venue: details.venue,
        updatedAt: details.updatedAt,
        updatedBy: details.updatedBy
      }
    });
  } catch (error) {
    console.error('❌ Error updating event details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/event-details/banner
 * Upload banner image
 */
router.post('/event-details/banner', upload.single('bannerImage'), async (req, res) => {
  try {
    const { updatedBy } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required'
      });
    }

    // Get or create event details document
    let details = await EventDetails.findOne();
    if (!details) {
      details = await EventDetails.create({});
    }

    // Update banner image
    details.bannerImage = {
      data: req.file.buffer,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };
    details.updatedBy = updatedBy || 'Admin';
    details.updatedAt = new Date();

    await details.save();

    console.log(`✅ Banner image uploaded by ${updatedBy || 'Admin'} (${(req.file.size / 1024).toFixed(2)} KB)`);

    res.json({
      success: true,
      message: 'Banner image uploaded successfully',
      data: {
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: details.bannerImage.uploadedAt
      }
    });
  } catch (error) {
    console.error('❌ Error uploading banner image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload banner image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/event-details/banner
 * Get banner image
 */
router.get('/event-details/banner', async (req, res) => {
  try {
    const details = await EventDetails.findOne();

    if (!details || !details.bannerImage || !details.bannerImage.data) {
      return res.status(404).json({
        success: false,
        message: 'Banner image not found'
      });
    }

    res.setHeader('Content-Type', details.bannerImage.mimetype);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(details.bannerImage.data);

  } catch (error) {
    console.error('❌ Error fetching banner image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/event-details/banner
 * Delete banner image
 */
router.delete('/event-details/banner', async (req, res) => {
  try {
    const details = await EventDetails.findOne();

    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'Event details not found'
      });
    }

    details.bannerImage = {
      data: null,
      mimetype: null,
      size: null,
      uploadedAt: null
    };

    await details.save();

    console.log(`🗑️  Banner image deleted`);

    res.json({
      success: true,
      message: 'Banner image deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting banner image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
