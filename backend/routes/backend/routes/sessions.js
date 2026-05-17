const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      phoneNumber: session.phoneNumber,
      status: session.status,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
      age: session.age
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Delete session
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOneAndDelete({ sessionId });
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }
    
    // Update user record
    await User.updateOne(
      { phoneNumber: session.phoneNumber },
      { $pull: { sessions: { sessionId } } }
    );
    
    res.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Regenerate session ID
router.post('/regenerate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const oldSession = await Session.findOne({ sessionId });
    
    if (!oldSession) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }
    
    // Generate new session ID
    const newSessionId = `VIPER-XMD-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    const newSession = new Session({
      sessionId: newSessionId,
      phoneNumber: oldSession.phoneNumber,
      creds: oldSession.creds,
      status: 'active',
      deviceInfo: oldSession.deviceInfo
    });
    
    await newSession.save();
    
    // Update user
    await User.updateOne(
      { phoneNumber: oldSession.phoneNumber },
      { 
        $push: { sessions: { sessionId: newSessionId } },
        $pull: { sessions: { sessionId: oldSession.sessionId } }
      }
    );
    
    await Session.findByIdAndDelete(oldSession._id);
    
    res.json({
      success: true,
      sessionId: newSessionId,
      message: 'Session regenerated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get all sessions for a phone number
router.get('/user/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      return res.json({ 
        success: true,
        sessions: [] 
      });
    }
    
    const sessions = await Session.find({ 
      phoneNumber,
      status: 'active' 
    }).select('-creds');
    
    res.json({
      success: true,
      sessions,
      total: user.totalSessionsGenerated
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
