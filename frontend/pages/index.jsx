import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Zap, Shield, Rocket, Database, Users, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import TerminalLogs from '../components/TerminalLogs';
import AnimatedBackground from '../components/AnimatedBackground';
import StatusIndicator from '../components/StatusIndicator';
import SessionCard from '../components/SessionCard';
import { generatePairing, checkPairingStatus, getSession } from '../utils/api';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pairingCode, setPairingCode] = useState(null);
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [status, setStatus] = useState('idle');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    // Simulate online count
    const interval = setInterval(() => {
      setOnlineCount(Math.floor(Math.random() * 50) + 10);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentSessionId && pollingInterval) {
      // Poll for status updates
      const checkStatus = async () => {
        try {
          const statusData = await checkPairingStatus(currentSessionId);
          
          if (statusData.connected && !session) {
            addLog('✅ WhatsApp connected successfully!', 'success');
            const sessionData = await getSession(currentSessionId);
            setSession(sessionData);
            setStatus('connected');
            setIsGenerating(false);
            toast.success('Session created successfully!');
            clearInterval(pollingInterval);
          }
          
          if (statusData.pairingCode && !pairingCode) {
            setPairingCode(statusData.pairingCode);
            addLog(`✅ Pairing code generated: ${statusData.pairingCode}`, 'success');
          }
        } catch (error) {
          console.error('Status check error:', error);
        }
      };
      
      const interval = setInterval(checkStatus, 3000);
      setPollingInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [currentSessionId, session]);

  const handleGenerateSession = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsGenerating(true);
    setPairingCode(null);
    setSession(null);
    setLogs([]);
    setStatus('connecting');
    
    const sessionId = `session_${Date.now()}`;
    setCurrentSessionId(sessionId);
    
    addLog('🚀 Initializing Viper XMD connection...', 'info');
    addLog(`📱 Generating pairing code for ${phoneNumber}...`, 'info');
    
    try {
      const response = await generatePairing(phoneNumber, sessionId);
      
      if (response.pairingCode) {
        setPairingCode(response.pairingCode);
        addLog(`✅ Pairing code generated: ${response.pairingCode}`, 'success');
        addLog('⏳ Waiting for WhatsApp connection...', 'info');
        toast.success(`Pairing code: ${response.pairingCode}`, { duration: 10000 });
      } else {
        addLog('❌ Failed to generate pairing code', 'error');
        setIsGenerating(false);
        setStatus('disconnected');
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      toast.error('Failed to generate session');
      setIsGenerating(false);
      setStatus('disconnected');
    }
  };

  const handleRegenerate = async () => {
    toast('Regenerating session...', { icon: '🔄' });
    addLog('🔄 Regenerating session...', 'info');
    // Implement regenerate logic
  };

  const handleDisconnect = () => {
    setSession(null);
    setStatus('disconnected');
    addLog('🔌 Session disconnected', 'info');
    toast.success('Session disconnected');
  };

  const handleDelete = () => {
    setSession(null);
    setStatus('idle');
    addLog('🗑️ Session deleted permanently', 'error');
    toast.success('Session deleted');
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0a0a0a',
          color: '#00ff41',
          border: '1px solid #00ff41',
          fontFamily: 'monospace'
        }
      }} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-neon/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Zap className="text-neon" size={32} />
            <h1 className="text-2xl font-bold glitch-text">
              <span className="text-neon">VIPER</span>
              <span className="text-white"> XMD</span>
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="hidden md:flex items-center gap-2">
              <Users size={16} className="text-neon" />
              <span className="text-sm">{onlineCount} Online</span>
            </div>
            <StatusIndicator status={status} />
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Generator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-card p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  <span className="text-neon">SESSION</span> GENERATOR
                </h2>
                <p className="text-gray-400">Generate your WhatsApp session securely</p>
              </div>

              {!session ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm mb-2 text-neon">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="254718180267"
                      className="w-full bg-black/50 border border-neon/30 rounded-lg px-4 py-3 text-neon placeholder-gray-500 focus:outline-none focus:border-neon transition-all"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code without + or spaces</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateSession}
                    disabled={isGenerating}
                    className="w-full neon-button relative overflow-hidden"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        GENERATING...
                      </span>
                    ) : (
                      'GENERATE SESSION'
                    )}
                  </motion.button>

                  {pairingCode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 bg-neon/10 border border-neon rounded-lg text-center"
                    >
                      <p className="text-sm text-gray-400 mb-2">Your pairing code:</p>
                      <p className="text-3xl font-bold text-neon tracking-wider">{pairingCode}</p>
                      <p className="text-xs text-gray-500 mt-2">Enter this code in your WhatsApp linked devices</p>
                    </motion.div>
                  )}
                </>
              ) : (
                <SessionCard
                  session={session}
                  onRegenerate={handleRegenerate}
                  onDisconnect={handleDisconnect}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </motion.div>

          {/* Right Column - Terminal Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TerminalLogs logs={logs} />
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            <span className="text-neon">CYBER</span> FEATURES
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Secure', desc: 'End-to-end encryption' },
              { icon: Rocket, title: 'Fast', desc: 'Lightning speed connections' },
              { icon: Database, title: 'Reliable', desc: '99.9% uptime guarantee' },
              { icon: Zap, title: 'Modern', desc: 'Latest Baileys version' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass-card p-6 text-center hover:border-neon transition-all cursor-pointer"
              >
                <feature.icon className="text-neon w-12 h-12 mx-auto mb-3" />
                <h4 className="font-bold mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neon/30 mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">© 2024 Viper XMD | Created by GlenTech</p>
              <p className="text-xs text-gray-500 mt-1">Advanced WhatsApp Session Generator</p>
            </div>
            <div className="flex gap-4">
              {[Github, Twitter, Linkedin,
