import pkg from 'gifted-baileys';
const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = pkg;
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }).then(() => mongoose);
  }
  cached.conn = await cached.promise;
  global.mongoose = cached;
  return cached.conn;
}

const SessionSchema = new mongoose.Schema({
  sessionId: String,
  phoneNumber: String,
  creds: Object,
  createdAt: { type: Date, default: Date.now }
});
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return res.status(500).json({ error: 'Database connection failed' });
  }
  
  const { phone, method } = req.body;
  const sessionId = `VIPER-XMD-${uuidv4().slice(0, 8).toUpperCase()}`;
  
  // Use gifted-baileys auth
  const { state, saveCreds } = await useMultiFileAuthState(`/tmp/sessions/${sessionId}`);
  
  // Create socket with gifted-baileys
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.macOS('Viper XMD'),
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  let pairingCode = null;
  let qrCode = null;
  let done = false;
  
  // Request pairing code if method is 'code'
  if (method === 'code') {
    pairingCode = await sock.requestPairingCode(phone);
  }
  
  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    // Handle QR code for QR method
    if (qr && method === 'qr' && !qrCode) {
      qrCode = await QRCode.toDataURL(qr);
      if (!res.headersSent) {
        res.json({ qr: qrCode, sessionId });
      }
    }
    
    // Handle successful connection
    if (connection === 'open' && !done) {
      done = true;
      const userNumber = sock.user.id.split(':')[0];
      
      // Save session to MongoDB
      const session = new Session({ 
        sessionId, 
        phoneNumber: userNumber, 
        creds: state 
      });
      await session.save();
      
      // Send Session ID via WhatsApp message
      await sock.sendMessage(`${userNumber}@s.whatsapp.net`, {
        text: `╔══════════════════════════╗\n║  ✅ PAIRING SUCCESSFUL   ║\n╚══════════════════════════╝\n\n🔐 YOUR SESSION ID:\n┌──────────────────────┐\n│ ${sessionId} │\n└──────────────────────┘\n\n📱 *Save this ID*\n🤖 Use in your .env file:\nSESSION_ID=${sessionId}\n\n⚡ Viper XMD\n👑 Owner: GlenTech`
      });
      
      if (!res.headersSent) {
        res.json({ success: true, sessionId, phoneNumber: userNumber });
      }
    }
    
    // Handle disconnection
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('Connection closed, reconnecting...');
      } else {
        console.log('Connection closed, logged out');
      }
    }
  });
  
  // Send response for pairing code method
  if (method === 'code' && !res.headersSent) {
    setTimeout(() => {
      if (!res.headersSent) {
        res.json({ pairingCode, sessionId });
      }
    }, 2000);
  }
}
