import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['wallet', 'phone', 'documents', 'keys', 'bag', 'jewelry', 'electronics', 'clothing', 'pet', 'other'];
const CATEGORY_ICONS = { wallet:'👜', phone:'📱', documents:'📄', keys:'🔑', bag:'🎒', jewelry:'💍', electronics:'💻', clothing:'👕', pet:'🐾', other:'📦' };

export default function ReportItem() {
  const { type } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLost = type === 'lost';

  const [form, setForm] = useState({ title:'', description:'', category:'', location:'', date: new Date().toISOString().split('T')[0] });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages(images.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a category');
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('type', type);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      const { data } = await api.post('/items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.secretCode) { setSecretCode(data.secretCode); }
      else { toast.success('Item reported! Matching in progress…'); navigate('/dashboard'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report item');
    } finally { setLoading(false); }
  };

  if (secretCode) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-up">
        <div className="text-6xl mb-5">🔐</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Save Your Secret Code</h1>
        <p className="text-slate-500 mb-8 text-sm">This code verifies the handshake when returning the item. <strong className="text-red-600">It will not be shown again.</strong></p>
        <div className="card p-7 mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Secret Code</p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-8 py-5 mb-4">
            <span className="text-3xl font-extrabold text-blue-700 tracking-[0.35em] font-mono">{secretCode}</span>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(secretCode); toast.success('Copied!'); }}
            className="btn-secondary text-sm py-2">📋 Copy to Clipboard</button>
        </div>
        <div className="card p-4 bg-orange-50 border-orange-200 mb-6 text-left">
          <p className="text-sm font-semibold text-orange-700 mb-1.5">⚠ Important</p>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Screenshot or write this code down</li>
            <li>Give this code to the person reclaiming the item</li>
            <li>Match is completed only after they verify this code</li>
          </ul>
        </div>
        <button onClick={() => { toast.success('Item reported!'); navigate('/dashboard'); }} className="btn-primary w-full">
          I've Saved My Code → Continue
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-5 -ml-1">← Back</button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isLost ? 'bg-red-50' : 'bg-green-50'}`}>
            {isLost ? '⚠' : '✅'}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Report</p>
            <h1 className="text-xl font-bold text-slate-900">{isLost ? 'Lost Item' : 'Found Item'}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Images */}
          <div className="card p-5">
            <label className="label">Photos (up to 5)</label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                  <img src={url} alt="" className="w-full h-full object-cover"/>
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xl font-bold">×</button>
                </div>
              ))}
              {previews.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <span className="text-slate-400 text-xl mb-0.5">+</span>
                  <span className="text-slate-400 text-[10px]">Add</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/>
                </label>
              )}
            </div>
            <p className="text-xs text-slate-400">Clear photos improve match accuracy</p>
          </div>

          {/* Basic info */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Item Name *</label>
              <input type="text" placeholder={isLost ? 'e.g., Black leather wallet' : 'e.g., Found blue backpack'}
                value={form.title} onChange={e => set('title', e.target.value)} className="input" required/>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea placeholder="Describe the item — color, brand, distinctive marks…"
                value={form.description} onChange={e => set('description', e.target.value)}
                className="input min-h-[90px] resize-none" rows={4} required/>
            </div>
          </div>

          {/* Category */}
          <div className="card p-5">
            <label className="label">Category *</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => set('category', cat)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                    form.category === cat
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-[10px] font-medium capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location & Date */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Location *</label>
              <input type="text" placeholder="e.g., T Nagar, Chennai or Anna Salai Bus Stop"
                value={form.location} onChange={e => set('location', e.target.value)} className="input" required/>
              <p className="text-xs text-slate-400 mt-1.5">Be specific for better matching</p>
            </div>
            <div>
              <label className="label">{isLost ? 'Date Lost' : 'Date Found'} *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input" required/>
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <label className="label mb-0">Contact Info (auto-filled)</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Name</p>
                <div className="input bg-slate-50 text-slate-500 cursor-not-allowed">{user?.name}</div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Phone</p>
                <div className="input bg-slate-50 text-slate-500 cursor-not-allowed">{user?.phone || 'Not set'}</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 flex items-center gap-1">
              🔒 Shared only with approved matches
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                Uploading & Reporting…
              </span>
            ) : `Submit ${isLost ? 'Lost' : 'Found'} Item Report →`}
          </button>
        </form>
      </main>
    </div>
  );
}