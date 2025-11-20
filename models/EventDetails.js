const mongoose = require('mongoose');

/**
 * EventDetails Schema
 * Stores the main event details displayed on the home page
 */
const eventDetailsSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    default: 'December 15, 2025'
  },
  time: {
    type: String,
    required: true,
    default: '6:00 PM - 11:00 PM'
  },
  venue: {
    type: String,
    required: true,
    default: 'Grand Ballroom'
  },
  bannerImage: {
    data: {
      type: Buffer,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Ensure only one document exists
eventDetailsSchema.statics.getDetails = async function() {
  let details = await this.findOne();
  if (!details) {
    details = await this.create({});
  }
  return details;
};

eventDetailsSchema.statics.updateDetails = async function(data, updatedBy = 'Admin') {
  let details = await this.findOne();
  if (!details) {
    details = new this(data);
  } else {
    details.date = data.date;
    details.time = data.time;
    details.venue = data.venue;
  }
  details.updatedBy = updatedBy;
  details.updatedAt = new Date();
  await details.save();
  return details;
};

module.exports = mongoose.model('EventDetails', eventDetailsSchema);
