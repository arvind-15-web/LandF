import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/items/my/items')
      .then(({ data }) => setMyItems(data))
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }, []);

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setPreviewImg(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (name !== user.name) fd.append('name', name);
      if (imgFile) fd.append('profileImage', imgFile);

      await api.patch('/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      setImgFile(null);
      setPreviewImg(null);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const lostItems = myItems.filter(i => i.type === 'lost');
  const foundItems = myItems.filter(i => i.type === 'found');

  const starsLabel = () => {
    const s = user?.stars || 0;
    if (s === 0) return 'No stars yet';
    if (s < 5) return 'Community Helper';
    if (s < 10) return 'Trusted Finder';
    return 'Star Citizen 🌟';
  };

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <p className="section-title mb-1">Account</p>
          <h1 className="page-header">My Profile</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left — Profile card */}
          <div className="space-y-4 animate-fade-up">
            {/* Avatar */}
            <div className="card p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-ink-700 ring-4 ring-ink-700 mx-auto">
                  {previewImg || user?.profileImage ? (
                    <img src={previewImg || user.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-ink-300">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-ink-900 hover:bg-amber-500 transition-colors shadow-lg"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImgChange} className="hidden" />
              </div>

              <h2 className="font-display font-bold text-xl text-ink-50">{user?.name}</h2>
              <p className="text-xs text-ink-500 font-mono mt-1">{user?.email}</p>

              {/* Stars */}
              <div className="mt-4 p-3 bg-amber-400/10 rounded-xl border border-amber-400/20">
                <div className="text-2xl font-display font-black text-amber-400">
                  {'⭐'.repeat(Math.min(user?.stars || 0, 5))}
                  {(user?.stars || 0) === 0 && <span className="text-ink-600">☆☆☆☆☆</span>}
                </div>
                <p className="text-xs text-ink-400 font-mono mt-1">{user?.stars || 0} stars · {starsLabel()}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="card p-4">
              <p className="section-title mb-3">Activity</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ink-700 rounded-xl p-3 text-center">
                  <div className="text-2xl font-display font-black text-signal-red">{lostItems.length}</div>
                  <div className="text-xs text-ink-500 font-mono">Lost Reports</div>
                </div>
                <div className="bg-ink-700 rounded-xl p-3 text-center">
                  <div className="text-2xl font-display font-black text-signal-green">{foundItems.length}</div>
                  <div className="text-xs text-ink-500 font-mono">Found Reports</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Edit form + Items */}
          <div className="md:col-span-2 space-y-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {/* Edit form */}
            <div className="card p-5">
              <p className="section-title mb-4">Edit Profile</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={user?.email || ''} className="input bg-ink-800 text-ink-400 cursor-not-allowed" readOnly />
                  <p className="text-xs text-ink-600 mt-1 font-mono">Email cannot be changed</p>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" value={user?.phone || ''} className="input bg-ink-800 text-ink-400 cursor-not-allowed" readOnly />
                  <p className="text-xs text-ink-600 mt-1 font-mono">Phone cannot be changed</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={handleLogout} className="btn-danger px-4 py-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* My Items */}
            <div className="card p-5">
              <p className="section-title mb-4">My Reported Items</p>
              {loadingItems ? <Spinner /> : myItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-ink-500 font-mono text-sm">No items reported yet</p>
                  <button onClick={() => navigate('/dashboard')} className="btn-secondary mt-4 text-sm py-2">
                    Report an Item
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myItems.map(item => (
                    <button
                      key={item._id}
                      onClick={() => navigate(`/items/${item._id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-ink-700 transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-ink-700 shrink-0">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm text-ink-100 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-mono ${item.type === 'lost' ? 'text-signal-red' : 'text-signal-green'}`}>
                            {item.type === 'lost' ? '⚠ Lost' : '✅ Found'}
                          </span>
                          <span className="text-ink-600 text-xs font-mono">·</span>
                          <span className="text-xs text-ink-500 font-mono capitalize">{item.status}</span>
                        </div>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-600 group-hover:text-ink-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
