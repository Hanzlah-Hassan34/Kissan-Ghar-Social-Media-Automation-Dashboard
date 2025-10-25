import { useEffect, useState } from 'react';
import { listProducts, getRefs } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { NeonCard, NeonButton, NeonInput, NeonSelect } from '../components/Neon';

// Languages list exactly as specified
const LANGUAGES = [
  'English','Spanish','French','German','Italian','Portuguese','Russian','Urdu','Arabic',
  'Japanese','Korean','Chinese','Indonesian','Vietnamese','Thai','Dutch','Turkish',
  'Polish','Ukrainian','Swedish','Czech','Danish','Finnish','Norwegian','Romanian',
  'Greek','Hungarian','Hebrew'
];

const sizes = ['1:1','9:16','16:9','4:5','full'] as const;

export default function CreateVideo() {
  const [prompt, setPrompt] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(90);
  const [screen, setScreen] = useState<'1:1'|'9:16'|'16:9'|'4:5'|'full'>('16:9');
  const [language, setLanguage] = useState('English');
  const [refs, setRefs] = useState<any[]>([]);
  const [companyById, setCompanyById] = useState<Record<number, string>>({});
  const [categoryById, setCategoryById] = useState<Record<number, string>>({});
  const [selectedRefs, setSelectedRefs] = useState<number[]>([]);
  const [refQuery, setRefQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const [prods, r] = await Promise.all([listProducts(), getRefs()]);
      setRefs(prods);
      setCompanyById(Object.fromEntries(r.companies.map((c:any)=>[c.id, c.name])));
      setCategoryById(Object.fromEntries(r.categories.map((c:any)=>[c.id, c.name])));
    })();
  }, []);

  function validateForm() {
    const newErrors: Record<string, string> = {};
    
    if (!prompt.trim()) {
      newErrors.prompt = 'Video prompt is required';
    }
    
    if (!durationSeconds || durationSeconds <= 0) {
      newErrors.duration = 'Duration must be greater than 0 seconds';
    }
    
    if (!language) {
      newErrors.language = 'Language selection is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the new API endpoint
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: selectedRefs,
          prompt: prompt.trim(),
          duration_seconds: durationSeconds,
          screen_size: screen,
          language
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.detail || 'Failed to create video');
      }
      
      const result = await response.json();
      console.log('Video created:', result);
      
      // Navigate to in-progress page
      navigate('/in-progress');
      
    } catch (error) {
      console.error('Error creating video:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create video' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Create Video</h1>
      <NeonCard className="p-4">
        <form onSubmit={submit} className="space-y-4">
          {/* Video Prompt */}
          <div>
            <label className="block mb-1 font-medium text-white text-sm">Video Prompt *</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter video prompt..."
              className={`w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-primary focus:outline-none resize-none ${errors.prompt ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors.prompt && <p className="text-red-400 text-xs mt-1">{errors.prompt}</p>}
          </div>

          {/* Duration, Screen Size, and Language in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-medium text-white text-sm">Duration (seconds) *</label>
              <NeonInput 
                type="number"
                min="1"
                placeholder="90"
                value={durationSeconds}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationSeconds(parseInt(e.target.value) || 0)}
                className={errors.duration ? 'border-red-500' : ''}
              />
              {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
            </div>
            
            <div>
              <label className="block mb-1 font-medium text-white text-sm">Screen Size</label>
              <NeonSelect value={screen} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScreen(e.target.value as any)}>
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </NeonSelect>
            </div>

            <div>
              <label className="block mb-1 font-medium text-white text-sm">Language *</label>
              <NeonSelect 
                value={language} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
                className={errors.language ? 'border-red-500' : ''}
              >
                <option value="">Select a language</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </NeonSelect>
              {errors.language && <p className="text-red-400 text-xs mt-1">{errors.language}</p>}
            </div>
          </div>


          {/* Reference Products */}
          <div>
            <label className="block mb-1 font-medium text-white text-sm">Reference Products (Optional)</label>
            <div className="flex items-center gap-2 mb-2">
              <NeonInput 
                placeholder="Search products" 
                value={refQuery} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setRefQuery(e.target.value)}
                className="flex-1"
              />
              <NeonButton 
                type="button" 
                onClick={async ()=>{
                  const data = await listProducts(refQuery); 
                  setRefs(data); 
                }}
                className="px-3 py-2 text-sm"
              >
                Search
              </NeonButton>
            </div>
            
            <div className="grid md:grid-cols-4 gap-2 max-h-60 overflow-auto border border-white/10 rounded-lg p-2 bg-white/5">
              {refs.map((p) => {
                const sel = selectedRefs.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedRefs(sel ? selectedRefs.filter(id => id!==p.id) : [...selectedRefs, p.id])}
                    className={`text-left border border-white/10 rounded-lg px-2 py-2 transition-colors ${
                      sel ? 'bg-primary/20 border-primary/50' : 'bg-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {p.img && (
                        <img 
                          src={p.img} 
                          className="h-8 w-8 rounded object-cover shadow" 
                          alt={p.pname}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white truncate text-xs" title={p.pname}>
                          {p.pname}
                        </div>
                        <div className="text-xs text-white/60 truncate">
                          {companyById[p.company_id] || '—'} • {categoryById[p.cat_id] || '—'}
                        </div>
                        <div className="text-[10px] text-white/40">#{p.id}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {selectedRefs.length > 0 && (
              <p className="text-white/60 text-xs mt-1">
                {selectedRefs.length} product{selectedRefs.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              <p className="text-red-400 text-xs">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <NeonButton 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-3"
          >
            {isSubmitting ? 'Creating Video...' : 'Generate Video'}
          </NeonButton>
        </form>
      </NeonCard>
    </div>
  );
}