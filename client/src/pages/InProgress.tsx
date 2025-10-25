import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listVideos } from '../lib/api';
import { useSSE } from '../hooks/useSSE';

export default function InProgress() {
  const [videos, setVideos] = useState<any[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Record<number, string>>({});

  async function refresh() {
    // Get videos that are in progress (not completed)
    const pending = await listVideos('pending');
    const generatingScript = await listVideos('generating_script');
    const scriptGenerated = await listVideos('script_generated');
    const generatingVideo = await listVideos('generating_video');
    const videoGeneratedPending = await listVideos('video_generated_pending');
    const combined = [...pending, ...generatingScript, ...scriptGenerated, ...generatingVideo, ...videoGeneratedPending];
    setVideos(combined);
  }

  useEffect(() => { refresh(); }, []);

  // Set up SSE for real-time updates
  useSSE(['script_generated', 'video_update', 'video_approved'], (eventType, data) => {
    console.log(`InProgress: Received ${eventType} event:`, data);
    // Refresh the videos list when any relevant event occurs
    refresh();
  });

  async function openDetails(id: number) {
    setOpenId(openId === id ? null : id);
    // Script is now stored directly in the video object
    const video = videos.find(v => v.id === id);
    if (video && video.script) {
      setEditing((e) => ({ ...e, [id]: video.script }));
    }
  }

  async function approveScript(v: any) {
    const content = editing[v.id];
    // Call the new API endpoint to approve script and start video generation
    await fetch(`/api/videos/${v.id}/approve-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script_content: content })
    });
    await refresh();
  }

  async function regenerateScript(v: any) {
    // Call the new API endpoint to regenerate script
    await fetch(`/api/videos/${v.id}/regenerate-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'English' }) // Default language
    });
    await refresh();
  }

  async function approveVideo(v: any) {
    try {
      // Call the approve video API endpoint which will handle both approval and title generation
      await fetch(`/api/videos/${v.id}/approve-video`, {
        method: 'POST'
      });
      
      console.log('Video approved and title generation started for video:', v.id);
      await refresh();
    } catch (error) {
      console.error('Error approving video:', error);
    }
  }

  async function regenerateVideo(v: any) {
    // Call the new API endpoint to regenerate video
    await fetch(`/api/videos/${v.id}/regenerate-video`, {
      method: 'POST'
    });
    await refresh();
  }


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">In Progress</h1>
      <div className="space-y-4">
        {videos.map((v) => (
          <div key={v.id} className="glass p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white">{v.prompt}</div>
              <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">{v.video_status}</span>
            </div>
            <button className="mt-3 text-primary" onClick={() => openDetails(v.id)}>Details</button>
            <AnimatePresence>
            {openId === v.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 grid md:grid-cols-2 gap-4 overflow-hidden">
                <div className="glass p-4">
                  <div className="font-medium mb-2 text-white">Script</div>
                  <textarea 
                    className="input h-64 w-full bg-white/5 border-white/10 text-white" 
                    value={editing[v.id] || v.script || ''} 
                    onChange={(e) => setEditing({ ...editing, [v.id]: e.target.value })} 
                    placeholder="Script will appear here when generated..."
                  />
                  <div className="flex gap-2 mt-2">
                    {v.video_status === 'script_generated' && (
                      <>
                        <button className="px-3 py-2 rounded-xl bg-primary text-black" onClick={() => approveScript(v)}>Approve & Generate Video</button>
                        <button className="px-3 py-2 rounded-xl bg-white/10 border border-white/10" onClick={() => regenerateScript(v)}>Regenerate Script</button>
                      </>
                    )}
                    {v.video_status === 'pending' && (
                      <div className="text-yellow-400 text-sm">Waiting for script generation...</div>
                    )}
                  </div>
                </div>
                <div className="glass p-4">
                  <div className="font-medium mb-2 text-white">Video</div>
                  <div className="text-sm text-white/70">Status: {v.video_status}</div>
                  {v.preview_url && (
                    <div className="mt-2 w-full">
                      <video controls className="w-full h-64 rounded" src={v.preview_url} />
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {v.video_status === 'video_generated_pending' && (
                      <>
                        <button className="px-3 py-2 rounded-xl bg-white/10 border border-white/10" onClick={() => regenerateVideo(v)}>Regenerate Video</button>
                        <button className="px-3 py-2 rounded-xl bg-primary text-black" onClick={() => approveVideo(v)}>Approve Video</button>
                      </>
                    )}
                    {v.video_status === 'video_generated' && (
                      <>
                        <button className="px-3 py-2 rounded-xl bg-white/10 border border-white/10" onClick={() => regenerateVideo(v)}>Regenerate Video</button>
                        <button className="px-3 py-2 rounded-xl bg-primary text-black" onClick={() => window.location.href = '/generated-videos'}>Go to Generated Videos</button>
                      </>
                    )}
                    {v.video_status === 'generating_video' && (
                      <div className="text-blue-400 text-sm">Generating video...</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}


