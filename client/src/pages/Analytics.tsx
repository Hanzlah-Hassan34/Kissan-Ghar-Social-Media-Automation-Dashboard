import { useEffect, useState } from 'react';
import { getAnalytics } from '../lib/api';
import { NeonCard } from '../components/Neon';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useSSE } from '../hooks/useSSE';

export default function Analytics() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { getAnalytics().then(setRows); }, []);

  // Set up SSE for real-time updates
  useSSE(['script_generated', 'video_update', 'video_approved', 'title_generated', 'description_generated', 'video_upload_approved', 'upload_update'], (eventType, data) => {
    console.log(`Analytics: Received ${eventType} event:`, data);
    // Refresh analytics when any relevant event occurs
    getAnalytics().then(setRows);
  });
  const latest = rows[0] || {};
  const cards = [
    { label: 'Total Products', value: latest.total_products ?? 0 },
    { label: 'Scripts Generated', value: latest.scripts_generated ?? 0 },
    { label: 'Videos Generated', value: latest.videos_generated ?? 0 },
    { label: 'Videos Published', value: latest.videos_published ?? 0 },
    { label: 'Pending Approvals', value: latest.pending_approvals ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold neon-glow">Dashboard</h1>
      <div className="grid md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <NeonCard key={c.label} className="p-4">
            <div className="text-sm text-white/70">{c.label}</div>
            <div className="text-3xl font-bold mt-1">{c.value}</div>
          </NeonCard>
        ))}
      </div>
      <NeonCard className="p-4">
        <div className="text-white/70 mb-3">Monthly Overview</div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={rows.slice().reverse()}>
              <XAxis dataKey="date" stroke="#7dd3fc" tick={{ fill: '#7dd3fc' }} />
              <YAxis stroke="#a7f3d0" tick={{ fill: '#a7f3d0' }} />
              <Tooltip contentStyle={{ background: '#0b1020', border: '1px solid rgba(57,255,20,0.2)', color: '#fff' }} />
              <Bar dataKey="videos_generated" fill="#00E0FF" radius={[6,6,0,0]} />
              <Bar dataKey="videos_published" fill="#39FF14" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </NeonCard>
    </div>
  );
}


