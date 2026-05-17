import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
let cached = global.mongoose || { conn: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.conn = await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
  });
  global.mongoose = cached;
  return cached.conn;
}

const SessionSchema = new mongoose.Schema({ sessionId: String });
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    await connectDB();
    const session = await Session.findOne({ sessionId: id });
    res.json({ session: !!session });
  } catch (err) {
    console.error('Status check error:', err);
    res.json({ session: false, error: err.message });
  }
}
