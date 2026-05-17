const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessions: [{
    sessionId: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  }],
  totalSessionsGenerated: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  preferences: {
    theme: {
      type: String,
      enum: ['cyberpunk', 'dark', 'neon'],
      default: 'cyberpunk'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
});

// Update lastActive timestamp
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Method to add session
userSchema.methods.addSession = async function(sessionId) {
  this.sessions.push({
    sessionId,
    createdAt: new Date()
  });
  this.totalSessionsGenerated += 1;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
