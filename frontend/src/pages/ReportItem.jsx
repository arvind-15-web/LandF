import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['wallet', 'phone', 'documents', 'keys', 'bag', 'jewelry', 'electronics', 'clothing', 'pet', 'other'];
const CATEGORY_ICONS = {
  wallet: '👜', phone: '📱', documents: '📄', keys: '🔑',
  bag: '🎒', jewelry: '💍', electronics: '💻', clothing: '👕',
  pet: '🐾', other: '📦',
};

export default function ReportItem() {
  const { type } = useParams(); // 'lost' | 'found'
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLost = type === 'lost';

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeImage = (i) => {
    const newImages = images.filter((_, idx) => idx !== i);
    const newPreviews = previews.filter((_, idx) => idx !== i);
    setImages(newImages);
    setPreviews(newPreviews);
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

      const { data } = await api.post('/items', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.secretCode) {
        setSecretCode(data.secretCode);
      } else {
        toast.success('Item reported! Auto-matching in progress…');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  // Secret code reveal screen
  if (secretCode) {
    return (
      <div className="min-h-screen bg-ink-900">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-up">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="page-header mb-3">Save Your Secret Code</h1>
          <p className="text-ink-400 mb-8">
            This code is used for the final handshake when returning the item.
            <strong className="text-signal-red"> It will not be shown again.</strong>
          </p>

          <div className="card p-8 mb-6">
            <p className="section-title mb-3">Secret Code</p>
            <div className="bg-ink-700 border-2 border-amber-400/50 rounded-xl px-8 py-6 mb-4">
              <span className="text-4xl font-mono font-black text-amber-400 tracking-[0.3em]">
                {secretCode}
              </span>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(secretCode); toast.success('Copied!'); }}
              className="btn-secondary text-sm py-2"
            >
              📋 Copy to Clipboard
            </button>
          </div>

          <div className="card p-4 bg-signal-orange/10 border-signal-orange/30 mb-8 text-left">
            <p className="text-sm text-signal-orange font-semibold mb-1">⚠ Important Instructions</p>
            <ul className="text-sm text-ink-300 space-y-1 list-disc list-inside">
              <li>Screenshot or write this code down</li>
              <li>Give this code to the person reclaiming the item</li>
              <li>The match is only completed after they verify this code</li>
            </ul>
          </div>

          <button
            onClick={() => { toast.success('Item reported successfully!'); navigate('/dashboard'); }}
            className="btn-primary w-full"
          >
            I've Saved My Code → Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-4 -ml-2">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
              isLost ? 'bg-signal-red/15' : 'bg-signal-green/15'
            }`}>
              {isLost ? '⚠' : '✅'}
            </div>
            <div>
              <p className="section-title">Report</p>
              <h1 className="page-header">{isLost ? 'Lost Item' : 'Found Item'}</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {/* Images */}
          <div className="card p-5">
            <label className="label">Photos (up to 5)</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-ink-700 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-ink-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-signal-red text-xl"
                  >
                    ×
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-ink-600 hover:border-amber-400 hover:bg-ink-700 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <span className="text-ink-500 text-xl mb-1">+</span>
                  <span className="text-ink-600 text-[10px] font-mono">Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-ink-500 font-mono">Clear photos help with faster matching</p>
          </div>

          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Item Name / Title *</label>
              <input
                type="text"
                placeholder={isLost ? 'e.g., Black leather wallet' : 'e.g., Found blue backpack'}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                placeholder="Describe the item in detail — color, brand, distinctive marks, contents…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="input min-h-[100px] resize-none"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="card p-5">
            <label className="label">Category *</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', cat)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    form.category === cat
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-400'
                      : 'bg-ink-700 border-ink-600 text-ink-400 hover:border-ink-500 hover:text-ink-200'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-[10px] font-mono capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location & Date */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Location *</label>
              <input
                type="text"
                placeholder="e.g., T Nagar, Chennai or Anna Salai Bus Stop"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                className="input"
                required
              />
              <p className="text-xs text-ink-500 mt-1.5 font-mono">Be as specific as possible for better matching</p>
            </div>

            <div>
              <label className="label">{isLost ? 'Date Lost' : 'Date Found'} *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          {/* Contact (pre-filled) */}
          <div className="card p-5 space-y-4 border-ink-700">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-signal-green" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <label className="label mb-0">Contact Info (auto-filled from profile)</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-500 font-mono mb-1 block">Name</label>
                <div className="input bg-ink-800 text-ink-400 cursor-not-allowed">{user?.name}</div>
              </div>
              <div>
                <label className="text-xs text-ink-500 font-mono mb-1 block">Phone</label>
                <div className="input bg-ink-800 text-ink-400 cursor-not-allowed">{user?.phone || 'Not set'}</div>
              </div>
            </div>
            <p className="text-xs text-ink-500 font-mono">
              🔒 Contact details are hidden from public. Shared only with approved matches.
            </p>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
                Uploading & Reporting…
              </span>
            ) : (
              `Submit ${isLost ? 'Lost' : 'Found'} Item Report →`
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
