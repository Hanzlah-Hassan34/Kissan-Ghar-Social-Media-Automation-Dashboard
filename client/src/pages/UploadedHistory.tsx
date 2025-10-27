import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listPublished, api } from '../lib/api';
import { useSSE } from '../hooks/useSSE';

export default function UploadedHistory() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);

  async function refresh() {
    // Fetch videos with status 'uploading' or 'published' for uploaded history
    const response = await api.get('/published-videos');
    const allData = response.data;
    const filteredData = allData.filter((item: any) => 
      item.status === 'uploading' || item.status === 'published'
    );
    setRows(filteredData);
  }
  useEffect(() => { refresh(); }, []);

  // Set up SSE for real-time updates
  useSSE(['video_upload_approved', 'upload_update'], (eventType, data) => {
    console.log(`UploadedHistory: Received ${eventType} event:`, data);
    // Refresh the videos list when any relevant event occurs
    refresh();
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Uploaded History</h1>
      <div className="glass overflow-hidden">
        <table className="w-full table-auto">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left text-white/70">Title</th>
              <th className="p-3 text-left text-white/70">Platform</th>
              <th className="p-3 text-left text-white/70">Upload Date</th>
              <th className="p-3 text-left text-white/70">Status</th>
              <th className="p-3 text-left text-white/70">URL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10 hover:bg-white/5 cursor-pointer" onClick={() => setOpen(r)}>
                <td className="p-3 text-white">{r.title || r.prompt || '-'}</td>
                <td className="p-3 text-white/80">{r.platform}</td>
                <td className="p-3 text-white/80">{r.uploaded_at ? new Date(r.uploaded_at).toLocaleString() : '-'}</td>
                <td className="p-3 text-white/80">{r.status}</td>
                <td className="p-3"><a className="text-primary" href={r.url} target="_blank" rel="noreferrer">{r.url ? 'Open' : '-'}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={()=>setOpen(null)}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 20 }} className="glass p-4 w-full max-w-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg text-white">{open.title || open.prompt}</div>
              <button onClick={()=>setOpen(null)} className="px-3 py-1 rounded-xl bg-white/10 border border-white/10">Close</button>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-white/70">Platform: {open.platform}</div>
              <div className="text-sm text-white/70">Status: {open.status}</div>
              <div className="text-sm text-white/70">URL: <a className="text-primary" href={open.url} target="_blank" rel="noreferrer">{open.url}</a></div>
              {open.preview_url && (
                <video className="w-full rounded-xl" src={open.preview_url} controls />
              )}
              <div className="text-sm whitespace-pre-wrap text-white/80">{open.description}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}


