import { useEffect, useState } from 'react';
import { listVideos } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { webhook } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useSSE } from '../hooks/useSSE';

export default function GeneratedVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [open, setOpen] = useState<number|null>(null);
  const [title, setTitle] = useState<Record<number,string>>({});
  const [description, setDescription] = useState<Record<number,string>>({});
  const [tags, setTags] = useState<Record<number,string>>({});
  const [platform, setPlatform] = useState<Record<number,string>>({});
  const navigate = useNavigate();

  async function refresh() {
    // Fetch from PublishedVideos table where status = 'pending'
    const response = await fetch('/api/published-videos?status=pending');
    const list = await response.json();
    setVideos(list);
    
    // Populate title, description, and tags fields with fetched data
    const titleData: Record<number, string> = {};
    const descriptionData: Record<number, string> = {};
    const tagsData: Record<number, string> = {};
    
    list.forEach((video: any) => {
      if (video.title) titleData[video.id] = video.title;
      if (video.description) descriptionData[video.id] = video.description;
      if (video.tags) tagsData[video.id] = video.tags;
    });
    
    setTitle(titleData);
    setDescription(descriptionData);
    setTags(tagsData);
  }
  useEffect(() => { refresh(); }, []);

  // Set up SSE for real-time updates
  useSSE(['video_approved', 'title_generated', 'title_approved', 'description_generated', 'description_approved', 'tags_generated', 'tags_approved', 'video_upload_approved'], (eventType, data) => {
    console.log(`GeneratedVideos: Received ${eventType} event:`, data);
    // Refresh the videos list when any relevant event occurs
    refresh();
  });

  async function regenerateTitle(v:any) {
    try {
      await fetch(`/api/videos/${v.generatedvideos_id}/generate-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: v.script
        })
      });
      console.log('Title regeneration started for video:', v.generatedvideos_id);
      await refresh();
    } catch (error) {
      console.error('Error regenerating title:', error);
    }
  }
  
  async function approveTitle(v:any) {
    try {
      // Update the title in the database and trigger tags generation (backend handles this)
      await fetch(`/api/videos/${v.generatedvideos_id}/approve-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title[v.id] })
      });
      
      console.log('Title approved for video:', v.generatedvideos_id, '- Tags generation should be triggered by backend');
      await refresh();
    } catch (error) {
      console.error('Error approving title:', error);
    }
  }
  
  async function regenerateDescription(v:any) {
    try {
      await fetch(`/api/videos/${v.generatedvideos_id}/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: v.script
        })
      });
      console.log('Description regeneration started for video:', v.generatedvideos_id);
      await refresh();
    } catch (error) {
      console.error('Error regenerating description:', error);
    }
  }
  
  async function approveDescription(v:any) {
    try {
    const pf = platform[v.id];
      if (!pf) {
        alert('Please select a platform first');
        return;
      }
      
      // Call the new endpoint that handles the duplication fix
      await fetch(`/api/published-videos/${v.id}/approve-and-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: pf,
          title: title[v.id],
          description: description[v.id],
          tags: tags[v.id] || ''
        })
      });
      
      console.log('Description approved and upload started for video:', v.id);
      await refresh(); // Refresh to update the UI
    } catch (error) {
      console.error('Error approving description:', error);
    }
  }

  async function regenerateTags(v:any) {
    try {
      await fetch(`/api/videos/${v.generatedvideos_id}/generate-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title[v.id],
          description: description[v.id]
        })
      });
      console.log('Tags regeneration started for video:', v.generatedvideos_id);
      await refresh();
    } catch (error) {
      console.error('Error regenerating tags:', error);
    }
  }
  
  async function approveTags(v:any) {
    try {
      await fetch(`/api/videos/${v.generatedvideos_id}/approve-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: tags[v.id]
        })
      });
      console.log('Tags approved for video:', v.generatedvideos_id);
      await refresh();
    } catch (error) {
      console.error('Error approving tags:', error);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Generated Videos</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {videos.map((v) => (
          <div key={v.id} className="glass p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white">{v.prompt || v.title}</div>
              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">{v.status}</span>
            </div>
            {v.title && (
              <div className="mt-2 text-sm text-white/80">
                <strong>Title:</strong> {v.title}
                {v.title_status && (
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    v.title_status === 'generated' ? 'bg-blue-500/20 text-blue-300' :
                    v.title_status === 'approved' ? 'bg-green-500/20 text-green-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {v.title_status}
                  </span>
                )}
              </div>
            )}
            {v.description && (
              <div className="mt-1 text-sm text-white/80">
                <strong>Description:</strong> {v.description.length > 100 ? v.description.substring(0, 100) + '...' : v.description}
                {v.description_status && (
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    v.description_status === 'generated' ? 'bg-blue-500/20 text-blue-300' :
                    v.description_status === 'approved' ? 'bg-green-500/20 text-green-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {v.description_status}
                  </span>
                )}
            </div>
            )}
            <button className="mt-3 text-primary" onClick={() => setOpen(open===v.id?null:v.id)}>Details</button>
            <AnimatePresence>
            {open===v.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4 overflow-hidden">
                {/* Video Preview Section */}
                {v.preview_url && (
                  <div className="glass p-3">
                    <div className="font-medium mb-2 text-white">Video Preview</div>
                    <video controls className="w-full rounded" src={v.preview_url} />
                  </div>
                )}
                <div className="glass p-3">
                  <div className="font-medium mb-2 text-white">Title</div>
                  <input className="input w-full bg-white/5 border-white/10 text-white" value={title[v.id]||''} onChange={(e)=>setTitle({...title,[v.id]:e.target.value})} />
                  <div className="flex gap-2 mt-2">
                    <button 
                      className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 cursor-pointer" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Regenerate title clicked for video:', v.id);
                        regenerateTitle(v);
                      }}
                    >
                      Regenerate
                    </button>
                    <button 
                      className="px-3 py-2 rounded-xl bg-green-600 border border-green-700 hover:bg-green-700 cursor-pointer text-white font-medium" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Approve title clicked for video:', v.id);
                        approveTitle(v);
                      }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
                <div className="glass p-3">
                  <div className="font-medium mb-2 text-white">Tags</div>
                  <textarea className="input h-24 w-full bg-white/5 border-white/10 text-white" value={tags[v.id]||''} onChange={(e)=>setTags({...tags,[v.id]:e.target.value})} placeholder="Comma-separated tags..." />
                  <div className="flex gap-2 mt-2">
                    <button 
                      className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 cursor-pointer" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Regenerate tags clicked for video:', v.id);
                        regenerateTags(v);
                      }}
                    >
                      {v.tags_status === 'pending' ? 'Generate Tags' : 'Regenerate'}
                    </button>
                    <button 
                      className="px-3 py-2 rounded-xl bg-green-600 border border-green-700 hover:bg-green-700 cursor-pointer text-white font-medium" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Approve tags clicked for video:', v.id);
                        approveTags(v);
                      }}
                    >
                      Approve Tags
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Status: <span className={`px-2 py-1 rounded ${
                      v.tags_status === 'approved' ? 'bg-green-500/20 text-green-300' :
                      v.tags_status === 'generated' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>{v.tags_status || 'pending'}</span>
                  </div>
                </div>
                <div className="glass p-3">
                  <div className="font-medium mb-2 text-white">Description</div>
                  <textarea className="input h-32 w-full bg-white/5 border-white/10 text-white" value={description[v.id]||''} onChange={(e)=>setDescription({...description,[v.id]:e.target.value})} />
                  <div className="grid md:grid-cols-3 gap-2 mt-2 items-center">
                    <select className="input bg-white/5 border-white/10 text-white" value={platform[v.id]||''} onChange={(e)=>setPlatform({...platform,[v.id]:e.target.value})}>
                      <option value="">Select Platform</option>
                      <option value="All">All</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                    </select>
                    <div className="flex gap-2 md:col-span-2">
                      <button 
                        className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 cursor-pointer" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Regenerate description clicked for video:', v.id);
                          regenerateDescription(v);
                        }}
                      >
                        Regenerate
                      </button>
                      <button 
                        className="px-3 py-2 rounded-xl bg-green-600 border border-green-700 hover:bg-green-700 cursor-pointer text-white font-medium" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Approve description clicked for video:', v.id);
                          approveDescription(v);
                        }}
                      >
                        Approve & Upload
                      </button>
                    </div>
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


