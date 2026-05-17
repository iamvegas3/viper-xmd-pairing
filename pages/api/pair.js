import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import QRCode from 'qrcode';

mongoose.connect(process.env.MONGODB_URI);

const SessionSchema = new mongoose.Schema({
  sessionId: String,
  phoneNumber: String,
  creds: Object,
  createdAt: { type: Date, default: Date.now }
});
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();
  
  const { phone, method } = req.body;
  const sessionId = `VIPER-XMD-${uuidv4().slice(0, 8).toUpperCase()}`;
  
  const { state, saveCreds } = await useMultiFileAuthState(`/tmp/sessions/${sessionId}`);
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  
  sock.ev.on('creds.update', saveCreds);
  
  let pairingCode = null;
  let qrCode = null;
  let done = false;
  
  if (method === 'code') {
    pairingCode = await sock.requestPairingCode(phone);
  }
  
  sock.ev.on('connection.update', async (update) => {
    if (update.qr && method === 'qr' && !qrCode) {
      qrCode = await QRCode.toDataURL(update.qr);
      if (!res.headersSent) res.json({ qr: qrCode, sessionId });
    }
    
    if (update.connection === 'open' && !done) {
      done = true;
      const userNumber = sock.user.id.split(':')[0];
      
      await new Session({ sessionId, phoneNumber: userNumber, creds: state }).save();
      
      await sock.sendMessage(`${userNumber}@s.whatsapp.net`, {
        text: `✅ PAIRING SUCCESSFUL!\n\n🔐 SESSION ID:\n${sessionId}\n\nSave this ID for your bot.\n\n📝 Use in .env:\nSESSION_ID=${sessionId}\n\n⚡ Viper XMD | GlenTech`
      });
      
      if (!res.headersSent) {
        res.json({ success: true, sessionId, phoneNumber: userNumber });
      }
    }
  });
  
  if (method === 'code' && !res.headersSent) {
    setTimeout(() => {
      if (!res.headersSent) res.json({ pairingCode, sessionId });
    }, 2000);
  }
}
