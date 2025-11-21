const mongoose = require('mongoose');

/**
 * TicketRegistration Schema
 * Stores ticket registration submissions with verification status
 */
const ticketRegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactNo: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  additionalDescription: {
    type: String,
    default: null,
    trim: true
  },
  descriptionReadBy: {
    type: [String],
    default: []
  },
  ticketPrice: {
    type: Number,
    required: true,
    default: 3000
  },
  bankSlip: {
    data: {
      type: Buffer,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  ticketId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Generate unique ticket ID (e.g., EVT-A1B2C3)
ticketRegistrationSchema.methods.generateTicketId = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar-looking characters
  let id = 'EVT-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Index for faster queries
ticketRegistrationSchema.index({ email: 1 });
ticketRegistrationSchema.index({ status: 1 });
ticketRegistrationSchema.index({ createdAt: -1 });

// Static methods
ticketRegistrationSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const pending = await this.countDocuments({ status: 'pending' });
  const approved = await this.countDocuments({ status: 'approved' });
  const rejected = await this.countDocuments({ status: 'rejected' });
  
  // Calculate total revenue from approved registrations
  const approvedRegistrations = await this.find({ status: 'approved' });
  const totalRevenue = approvedRegistrations.reduce((sum, reg) => sum + (reg.ticketPrice || 3000), 0);
  
  return {
    total,
    pending,
    approved,
    rejected,
    totalRevenue
  };
};

ticketRegistrationSchema.statics.getPendingRegistrations = async function() {
  return this.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .select('-bankSlip.path'); // Don't expose file path in list
};

ticketRegistrationSchema.statics.approveRegistration = async function(id, reviewedBy) {
  return this.findByIdAndUpdate(
    id,
    {
      status: 'approved',
      reviewedBy,
      reviewedAt: new Date()
    },
    { new: true }
  );
};

ticketRegistrationSchema.statics.rejectRegistration = async function(id, reviewedBy, reason) {
  return this.findByIdAndUpdate(
    id,
    {
      status: 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: reason || 'No reason provided'
    },
    { new: true }
  );
};

module.exports = mongoose.model('TicketRegistration', ticketRegistrationSchema);
