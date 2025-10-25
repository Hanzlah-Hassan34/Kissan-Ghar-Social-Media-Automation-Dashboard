import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: any) {
  const [compact, setCompact] = useState(false);
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex">
      <div className={`transition-all duration-300 ${compact ? 'w-20' : 'w-64'}`}>
        <Sidebar compact={compact} setCompact={setCompact} />
      </div>
      <div className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between glass p-3">
          <div className="font-semibold neon-glow">Kissan Ghar Dashboard</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCompact(!compact)} className="px-3 py-1 rounded-xl bg-white/5 border border-white/10">{compact ? 'Expand' : 'Compact'}</button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-white/5 border border-white/10">
              <User className="text-primary" size={18} />
              <span className="text-sm">{user?.name || user?.email}</span>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors"
            >
              <LogOut size={16} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div key={(children as any)?.type?.name || 'route'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


