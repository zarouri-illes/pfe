import { motion } from 'framer-motion';

export const FloatingIcon = ({ icon: Icon, color, delay, x, y, size = 48 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      y: [y, y - 20, y],
      x: [x, x + 10, x]
    }}
    transition={{ 
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.5, delay },
      y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay * 2 },
      x: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: delay * 1.5 }
    }}
    style={{ left: `${x}%`, top: `${y}%` }}
    className="absolute z-30"
  >
    <div className={`p-3 rounded-2xl bg-white shadow-xl border border-slate-50 text-${color}`}>
      <Icon size={size / 2} fill={color === 'white' ? 'white' : 'transparent'} />
    </div>
  </motion.div>
);
