const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  creds: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'disconnected', 'deleted', 'connecting'],
    default: 'connecting'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Auto delete after 30 days
  },
  deviceInfo: {
    type: Object,
    default: {
      platform: 'Viper XMD',
      version: '1.0.0',
      browser: 'Chrome'
    }
  },
  ipAddress: String,
  userAgent: String,
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
});

// Update lastActive on any access
sessionSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Virtual for session age
sessionSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Session', sessionSchema);
