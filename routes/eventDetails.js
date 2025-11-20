const express = require('express');
const router = express.Router();
const EventDetails = require('../models/EventDetails');

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

module.exports = router;
