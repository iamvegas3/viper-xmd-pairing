const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');

const activeConnections = new Map();

async function generatePairingCode(phoneNumber) {
  const sessionId = uuidv4();
  const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Viper XMD', 'Chrome', '1.0.0'],
    markOnlineOnConnect: true
  });
  
  let pairingCode = null;
  let connectionResolve = null;
  const connectionPromise = new Promise((resolve) => {
    connectionResolve = resolve;
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (connection === 'open') {
      const phoneNumberConnected = sock.user.id.split(':')[0];
      
      const session = new Session({
        sessionId: sessionId,
        phoneNumber: phoneNumberConnected,
        creds: state,
        status: 'active',
        lastActive: new Date()
      });
      
      await session.save();
      connectionResolve({ connected: true, sessionId, phoneNumber: phoneNumberConnected });
    }
  });
  
  pairingCode = await sock.requestPairingCode(phoneNumber);
  
  activeConnections.set(sessionId, { sock, connectionPromise });
  
  return { pairingCode, sessionId };
}

async function checkConnectionStatus(sessionId) {
  const connection = activeConnections.get(sessionId);
  if (!connection) {
    return { connected: false };
  }
  
  const result = await Promise.race([
    connection.connectionPromise,
    new Promise((resolve) => setTimeout(() => resolve({ connected: false }), 60000))
  ]);
  
  return result;
}

module.exports = { generatePairingCode, checkConnectionStatus };
