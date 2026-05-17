import { motion } from 'framer-motion';

export default function StatusIndicator({ status }) {
  const getStatusConfig = () => {
    switch(status) {
      case 'connected':
        return { color: 'bg-green-500', text: 'CONNECTED', pulse: true };
      case 'connecting':
        return { color: 'bg-yellow-500', text: 'CONNECTING...', pulse: true };
      case 'disconnected':
        return { color: 'bg-red-500', text: 'DISCONNECTED', pulse: false };
      default:
        return { color: 'bg-gray-500', text: 'IDLE', pulse: false };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={config.pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={`w-3 h-3 rounded-full ${config.color}`}
      />
      <span className="text-xs font-mono text-neon">{config.text}</span>
    </div>
  );
}
