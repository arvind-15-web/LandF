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
  const isLost = item.type === 'lost';

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-6 -ml-2">← Back</button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3 animate-fade-up">
            <div className="aspect-square rounded-2xl overflow-hidden bg-ink-800 border border-ink-700">
              {item.images?.[activeImg] ? (
                <img src={item.images[activeImg]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">📦</div>
              )}
            </div>
            {item.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeImg === i ? 'border-amber-400' : 'border-ink-700 hover:border-ink-500'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="animate-fade-up space-y-5" style={{ animationDelay: '0.1s' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={isLost ? 'badge-lost' : 'badge-found'}>
                  {isLost ? '⚠ Lost' : '✅ Found'}
                </span>
                <span className="badge bg-ink-700 text-ink-300 border border-ink-600 capitalize">{item.category}</span>
              </div>
              <h1 className="text-3xl font-display font-black text-ink-50 mb-2">{item.title}</h1>
              <p className="text-ink-400 leading-relaxed">{item.description}</p>
            </div>

            <div className="divider" />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-ink-700 rounded-lg flex items-center justify-center text-sm">📍</div>
                <div>
                  <p className="text-xs text-ink-500 font-mono">Location</p>
                  <p className="text-sm text-ink-200 font-semibold">{item.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-ink-700 rounded-lg flex items-center justify-center text-sm">📅</div>
                <div>
                  <p className="text-xs text-ink-500 font-mono">Date {isLost ? 'Lost' : 'Found'}</p>
                  <p className="text-sm text-ink-200 font-semibold">
                    {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Reporter */}
            <div className="card p-4">
              <p className="section-title mb-3">Reported By</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-ink-700 border border-ink-600">
                  {item.reportedBy?.profileImage ? (
                    <img src={item.reportedBy.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm">
                      {item.reportedBy?.name?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-display font-semibold text-ink-100">{item.reportedBy?.name}</p>
                  {item.reportedBy?.stars > 0 && (
                    <p className="text-xs text-amber-400 font-mono">⭐ {item.reportedBy.stars} stars</p>
                  )}
                </div>
              </div>
              <div className="mt-3 p-3 bg-ink-700 rounded-lg">
                <p className="text-xs text-ink-500 font-mono flex items-center gap-1">
                  🔒 Contact hidden — visible only after match approval
                </p>
              </div>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="card p-4 bg-ink-700/30">
                <p className="text-sm text-ink-400 text-center font-mono">This is your reported item</p>
                <button
                  onClick={() => navigate('/matches')}
                  className="btn-secondary w-full mt-3 text-sm"
                >
                  View Matches →
                </button>
              </div>
            ) : (
              <div className="card p-4 bg-amber-400/5 border-amber-400/20">
                <p className="text-sm text-ink-300 mb-3">
                  Think this matches your item? Check your matches page to connect.
                </p>
                <button onClick={() => navigate('/matches')} className="btn-primary w-full text-sm">
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
