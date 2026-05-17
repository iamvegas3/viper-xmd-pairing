const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI);

// Session Schema
const SessionSchema = new mongoose.Schema({
  sessionId: String,
  phoneNumber: String,
  creds: Object,
  status: String,
  createdAt: { type: Date, default: Date.now }
});
const Session = mongoose.model('Session', SessionSchema);

// Store active connections
const connections = new Map();

// Generate Pairing Code
app.post('/api/pair', async (req, res) => {
  const { phone } = req.body;
  const sessionId = `VIPER-${uuidv4().slice(0, 8)}`;
  
  const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  
  sock.ev.on('creds.update', saveCreds);
  
  let resolved = false;
  const pairingCode = await sock.requestPairingCode(phone);
  
  sock.ev.on('connection.update', async (update) => {
    if (update.connection === 'open' && !resolved) {
      resolved = true;
      const session = new Session({
        sessionId,
        phoneNumber: sock.user.id.split(':')[0],
        creds: state,
        status: 'active'
      });
      await session.save();
      res.json({ success: true, sessionId, phoneNumber: sock.user.id.split(':')[0] });
    }
  });
  
  connections.set(sessionId, { sock, pairingCode });
  res.json({ success: true, pairingCode, sessionId });
});

// Check Status
app.get('/api/status/:sessionId', async (req, res) => {
  const conn = connections.get(req.params.sessionId);
  if (conn) {
    res.json({ connected: true, sessionId: req.params.sessionId });
  } else {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    res.json({ connected: !!session, session: session });
  }
});

// Get Session
app.get('/api/session/:sessionId', async (req, res) => {
  const session = await Session.findOne({ sessionId: req.params.sessionId });
  res.json(session);
});

// Delete Session
app.delete('/api/session/:sessionId', async (req, res) => {
  await Session.deleteOne({ sessionId: req.params.sessionId });
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
