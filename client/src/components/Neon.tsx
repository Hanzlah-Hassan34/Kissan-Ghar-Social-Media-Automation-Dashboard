import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function NeonCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      whileHover={{ y: -4, rotateX: 1.5, rotateY: -1.5, boxShadow: '0 20px 60px rgba(0,255,240,0.22)' }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={`glass neon-border ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function NeonButton({ children, className = '', ...props }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ boxShadow: '0 0 24px rgba(57,255,20,0.35)' }}
      className={`px-4 py-2 rounded-2xl bg-gradient-to-r from-primary via-neonCyan to-neonBlue text-black font-semibold ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function NeonInput(props: any) {
  return <input className="input bg-white/5 border-white/10 text-white placeholder-white/50 text-base" {...props} />;
}

export function NeonSelect(props: any) {
  return <select className="input bg-white/5 border-white/10 text-white text-base" {...props} />;
}

export function NeonTextarea(props: any) {
  return <textarea className="input bg-white/5 border-white/10 text-white text-base" {...props} />;
}


