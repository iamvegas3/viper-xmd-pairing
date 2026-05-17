import { motion } from 'framer-motion';
import { Copy, Download, Check, RefreshCw, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SessionCard({ session, onRegenerate, onDisconnect, onDelete }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(session.sessionId);
    setCopied(true);
    toast.success('Session ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const data = JSON.stringify(session, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viper-xmd-session-${session.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Session file downloaded!');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-neon">SESSION ACTIVE</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs">CONNECTED</span>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center border-b border-neon/20 pb-2">
          <span className="text-gray-400">Phone Number:</span>
          <span className="font-mono">{session.phoneNumber}</span>
        </div>
        <div className="flex justify-between items-center border-b border-neon/20 pb-2">
          <span className="text-gray-400">Session ID:</span>
          <span className="font-mono text-sm">{session.sessionId}</span>
        </div>
        <div className="flex justify-between items-center border-b border-neon/20 pb-2">
          <span className="text-gray-400">Status:</span>
          <span className="text-green-500">{session.status}</span>
        </div>
        <div className="flex justify-between items-center border-b border-neon/20 pb-2">
          <span className="text-gray-400">Last Active:</span>
          <span>{new Date(session.lastActive).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-neon/10 border border-neon rounded-lg px-4 py-2 hover:bg-neon hover:text-black transition-all"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Copy ID'}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 bg-neon/10 border border-neon rounded-lg px-4 py-2 hover:bg-neon hover:text-black transition-all"
        >
          <Download size={18} />
          Download
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRegenerate}
          className="flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500 rounded-lg px-4 py-2 hover:bg-yellow-500 hover:text-black transition-all"
        >
          <RefreshCw size={18} />
          Regenerate
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDisconnect}
          className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500 rounded-lg px-4 py-2 hover:bg-red-500 hover:text-white transition-all"
        >
          <Power size={18} />
          Disconnect
        </motion.button>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onDelete}
        className="w-full mt-3 flex items-center justify-center gap-2 bg-red-500/5 border border-red-500/50 rounded-lg px-4 py-2 hover:bg-red-500 hover:text-white transition-all text-sm"
      >
        <Trash2 size={16} />
        Delete Session Permanently
      </motion.button>
    </motion.div>
  );
}
