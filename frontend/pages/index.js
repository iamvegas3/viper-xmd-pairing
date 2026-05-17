import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Zap, Shield, Rocket, Copy, Download, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle');

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    let interval;
    if (sessionId && !session) {
      interval = setInterval(async () => {
        try {
          const { data } = await axios.get(`${API}/api/status/${sessionId}`);
          if (data.connected && data.session) {
            setSession(data.session);
            setStatus('connected');
            setLoading(false);
            addLog(`✅ Connected: ${data.session.phoneNumber}`, 'success');
            addLog(`🔑 Session ID: ${data.session.sessionId}`, 'success');
            toast.success('Session created!');
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [sessionId, session]);

  const generateSession = async () => {
    if (!phone || phone.length < 10) return toast.error('Valid phone number required');
    
    setLoading(true);
    setPairingCode(null);
    setSession(null);
    setLogs([]);
    setStatus('connecting');
    
    addLog('🚀 Initializing Viper XMD...', 'info');
    addLog(`📱 Connecting to ${phone}...`, 'info');
    
    try {
      const { data } = await axios.post(`${API}/api/pair`, { phone });
      setPairingCode(data.pairingCode);
      setSessionId(data.sessionId);
      addLog(`✅ Pairing code: ${data.pairingCode}`, 'success');
      addLog('⏳ Waiting for WhatsApp connection...', 'info');
      toast.success(`Code: ${data.pairingCode}`);
    } catch (error) {
      addLog('❌ Connection failed', 'error');
      toast.error('Failed to generate session');
      setLoading(false);
      setStatus('disconnected');
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(session.sessionId);
    toast.success('Session ID copied!');
  };

  const downloadSession = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viper-${session.sessionId}.json`;
    a.click();
    toast.success('Session downloaded!');
  };

  const deleteSession = async () => {
    await axios.delete(`${API}/api/session/${session.sessionId}`);
    setSession(null);
    setStatus('idle');
    toast.success('Session deleted');
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <Toaster position="top-right" toastOptions={{ style: { background: '#000', color: '#0f0', border: '1px solid #0f0' } }} />
      
      {/* Matrix Background */}
      <canvas className="fixed inset-0 opacity-10" id="matrix"></canvas>
      
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/80 backdrop-blur border-b border-green-500/30 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="text-green-500" size={28} />
            <h1 className="text-2xl font-bold"><span className="text-green-500">VIPER</span> XMD</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs">{status.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Generator */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-black/50 backdrop-blur border border-green-500/30 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-center mb-8"><span className="text-green-500">SESSION</span> GENERATOR</h2>
            
            {!session ? (
              <>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="254718180267"
                  className="w-full bg-black/50 border border-green-500/30 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-green-500"
                  disabled={loading}
                />
                <button
                  onClick={generateSession}
                  disabled={loading}
                  className="w-full bg-green-500/10 border border-green-500 rounded-lg py-3 font-bold hover:bg-green-500 hover:text-black transition-all disabled:opacity-50"
                >
                  {loading ? 'GENERATING...' : 'GENERATE SESSION'}
                </button>
                
                {pairingCode && (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-6 p-4 border border-green-500 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Pairing Code</p>
                    <p className="text-4xl font-bold tracking-wider">{pairingCode}</p>
                    <p className="text-xs mt-2">Enter this code in WhatsApp Linked Devices</p>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-gray-400">Phone Number</p>
                  <p className="text-xl font-bold">{session.phoneNumber}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-gray-400">Session ID</p>
                  <p className="text-sm font-mono break-all">{session.sessionId}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={copyId} className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500 rounded-lg py-2 hover:bg-green-500 hover:text-black transition-all"><Copy size={16}/> Copy ID</button>
                  <button onClick={downloadSession} className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500 rounded-lg py-2 hover:bg-green-500 hover:text-black transition-all"><Download size={16}/> Download</button>
                  <button className="flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500 rounded-lg py-2"><RefreshCw size={16}/> Regenerate</button>
                  <button onClick={deleteSession} className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500 rounded-lg py-2"><Trash2 size={16}/> Delete</button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right - Terminal Logs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-black/50 backdrop-blur border border-green-500/30 rounded-xl p-4 h-96 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs">viper@xmd:~$</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className={`text-xs mb-1 ${log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                <span className="text-gray-600">[{log.time}]</span> {log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : '›'} {log.msg}
              </div>
            ))}
            {logs.length === 0 && <div className="text-gray-500 text-center mt-32">System ready. Awaiting commands...</div>}
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-12">
          {[{ icon: Shield, title: 'Secure', desc: 'End-to-end encrypted' }, { icon: Rocket, title: 'Fast', desc: 'Lightning quick' }, { icon: Zap, title: 'Modern', desc: 'Latest tech' }, { icon: Copy, title: 'Easy', desc: 'Copy & use' }].map((f, i) => (
            <div key={i} className="bg-black/50 backdrop-blur border border-green-500/30 rounded-xl p-4 text-center">
              <f.icon className="mx-auto mb-2" size={32} />
              <h4 className="font-bold">{f.title}</h4>
              <p className="text-xs text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-green-500/30 py-6 text-center text-sm text-gray-500">
        © 2024 Viper XMD | Created by GlenTech
      </footer>

      <script dangerouslySetInnerHTML={{
        __html: `
          const canvas = document.getElementById('matrix');
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const chars = '01';
          const drops = Array(Math.floor(canvas.width / 20)).fill(0);
          function draw() {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0f0';
            ctx.font = '20px monospace';
            for(let i = 0; i < drops.length; i++) {
              ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 20, drops[i] * 20);
              if(drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
              drops[i]++;
            }
          }
          setInterval(draw, 50);
          window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
        `
      }} />
    </div>
  );
}
