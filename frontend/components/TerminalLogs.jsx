import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TerminalLogs({ logs }) {
  const terminalRef = useRef(null);
  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);
  
  const getLogIcon = (type) => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'info': return '›';
      default: return '$';
    }
  };
  
  const getLogColor = (type) => {
    switch(type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'info': return 'text-blue-400';
      default: return 'text-neon';
    }
  };
  
  return (
    <div className="glass-card p-4 h-64 overflow-y-auto" ref={terminalRef}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neon/30">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="text-xs ml-2">viper@xmd:~$</span>
        <span className="text-xs animate-pulse">_</span>
      </div>
      <AnimatePresence>
        {logs.map((log, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`terminal-line text-sm ${getLogColor(log.type)} mb-1`}
          >
            <span className="text-gray-500">[{log.timestamp}]</span>
            <span className="mx-2">{getLogIcon(log.type)}</span>
            <span>{log.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {logs.length === 0 && (
        <div className="text-gray-500 text-center mt-20">
          System ready. Awaiting commands...
        </div>
      )}
    </div>
  );
}
