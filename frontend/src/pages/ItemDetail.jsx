import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/axios';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api.get(`/items/${id}`)
      .then(({ data }) => setItem(data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <><Navbar /><Spinner fullscreen /></>;
  if (!item) return null;

  const isOwner = item.reportedBy?._id === user?._id || item.reportedBy === user?._id;
  const isLost  = item.type === 'lost';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-5 -ml-1">← Back</button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-3 animate-fade-up">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              {item.images?.[activeImg] ? (
                <img src={item.images[activeImg]} alt={item.title} className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl opacity-10">📦</div>
              )}
            </div>
            {item.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((url, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      activeImg === i ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
                    }`}>
                    <img src={url} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={isLost ? 'badge-lost' : 'badge-found'}>
                  {isLost ? '⚠ Lost' : '✓ Found'}
                </span>
                <span className="badge bg-slate-100 text-slate-600 border border-slate-200 capitalize">{item.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h1>
              <p className="text-slate-500 leading-relaxed text-sm">{item.description}</p>
            </div>

            <div className="divider" />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base border border-blue-100">📍</div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Location</p>
                  <p className="text-sm font-semibold text-slate-800">{item.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base border border-blue-100">📅</div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Date {isLost ? 'Lost' : 'Found'}</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Reporter */}
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Reported By</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 border border-slate-200 flex items-center justify-center">
                  {item.reportedBy?.profileImage ? (
                    <img src={item.reportedBy.profileImage} alt="" className="w-full h-full object-cover"/>
                  ) : (
                    <span className="text-sm font-bold text-blue-600">{item.reportedBy?.name?.[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{item.reportedBy?.name}</p>
                  {item.reportedBy?.stars > 0 && (
                    <p className="text-xs text-amber-500">⭐ {item.reportedBy.stars} stars</p>
                  )}
                </div>
              </div>
              <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400">🔒 Contact hidden — visible only after match approval</p>
              </div>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="card p-4 bg-blue-50 border-blue-100 text-center">
                <p className="text-sm text-blue-600 font-medium mb-3">This is your reported item</p>
                <button onClick={() => navigate('/matches')} className="btn-primary text-sm py-2 w-full">
                  View Matches →
                </button>
              </div>
            ) : (
              <div className="card p-4 bg-slate-50">
                <p className="text-sm text-slate-600 mb-3">Think this matches your item? Check your matches to connect.</p>
                <button onClick={() => navigate('/matches')} className="btn-primary w-full text-sm py-2">
                  View My Matches →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}