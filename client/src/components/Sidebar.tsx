import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

const linkBase = 'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium';

const nav = [
  { to: '/add-product', label: 'Add New Product', icon: '🧩' },
  { to: '/create-video', label: 'Create Video', icon: '🎬' },
  { to: '/in-progress', label: 'In Progress', icon: '⚙️' },
  { to: '/generated-videos', label: 'Generated Videos', icon: '✅' },
  { to: '/uploaded-videos', label: 'Uploaded History', icon: '☁️' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
];

export function Sidebar({ compact: propCompact, setCompact: setPropCompact }: any) {
  const [internalCompact, setInternalCompact] = useState(false);
  const compact = propCompact ?? internalCompact;
  const setCompact = setPropCompact ?? setInternalCompact;
  return (
    <aside className={`p-4 space-y-4 glass h-full transition-all duration-300 ${compact ? 'w-20' : 'w-64'}`} onMouseEnter={()=>setCompact(false)}>
      <div className={`text-2xl font-bold neon-glow ${compact ? 'text-center' : ''}`}>Kissan Ghar</div>
      <nav className="space-y-2">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => `${linkBase} ${isActive ? 'bg-primary/20 text-primary neon-border' : 'hover:bg-white/5 text-white'} ${compact ? 'justify-center' : ''}`}
            onMouseLeave={()=>setCompact(compact)}
          >
            <motion.span whileHover={{ rotate: 10, scale: 1.05 }} className="text-lg">{n.icon}</motion.span>
            {!compact && <span>{n.label}</span>}
          </NavLink>
        ))}
      </nav>
      <button onClick={() => setCompact(!compact)} className="w-full text-xs mt-4 px-2 py-1 rounded-xl bg-white/10 border border-white/10">{compact ? 'Expand' : 'Compact'}</button>
    </aside>
  );
}


