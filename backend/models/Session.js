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
    required: true
  },
  creds: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'disconnected', 'deleted'],
    default: 'active'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60
  },
  deviceInfo: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Session', sessionSchema);
