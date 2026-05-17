import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI);
const SessionSchema = new mongoose.Schema({ sessionId: String });
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

export default async function handler(req, res) {
  const { id } = req.query;
  const session = await Session.findOne({ sessionId: id });
  res.json({ session: !!session });
}
