import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ItemCard from '../components/ItemCard';
import Spinner from '../components/Spinner';
import api from '../api/axios';

const CATEGORIES = ['all', 'wallet', 'phone', 'documents', 'keys', 'bag', 'jewelry', 'electronics', 'clothing', 'pet', 'other'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchItems();
  }, [activeTab, category]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: activeTab, limit: 24 });
      if (category !== 'all') params.set('category', category);
      const { data } = await api.get(`/items?${params}`);
      setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search.trim()
    ? items.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-up">
          <p className="section-title mb-1">Dashboard</p>
          <h1 className="page-header">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-ink-400 mt-2 text-sm">
            Help your community by reporting and recovering lost items.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => navigate('/report/lost')}
            className="group relative card p-6 text-left hover:border-signal-red/50 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-signal-red/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-signal-red/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                ⚠
              </div>
              <h3 className="font-display font-bold text-lg text-ink-50 mb-1">Report Lost Item</h3>
              <p className="text-sm text-ink-400">Something missing? Get help recovering it.</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/report/found')}
            className="group relative card p-6 text-left hover:border-signal-green/50 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-signal-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-signal-green/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                ✅
              </div>
              <h3 className="font-display font-bold text-lg text-ink-50 mb-1">Report Found Item</h3>
              <p className="text-sm text-ink-400">Found something? Help reunite it with its owner.</p>
            </div>
          </button>
        </div>

        {/* Browse Section */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="section-title mb-1">Browse Reports</p>
              <div className="flex gap-1">
                {['lost', 'found'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-5 py-2 rounded-lg font-display font-semibold text-sm capitalize transition-all ${
                      activeTab === t
                        ? t === 'lost'
                          ? 'bg-signal-red/15 text-signal-red border border-signal-red/30'
                          : 'bg-signal-green/15 text-signal-green border border-signal-green/30'
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {t === 'lost' ? '⚠ Lost Items' : '✅ Found Items'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search items…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 py-2 w-full sm:w-52"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-amber-400 text-ink-900 font-semibold'
                    : 'bg-ink-800 text-ink-400 hover:bg-ink-700 hover:text-ink-200 border border-ink-700'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Items grid */}
          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-5xl mb-4 opacity-30">{activeTab === 'lost' ? '🔍' : '📦'}</div>
              <p className="text-ink-500 font-mono text-sm">
                {search ? 'No items match your search' : `No ${activeTab} items reported yet`}
              </p>
              <button onClick={() => navigate(`/report/${activeTab}`)} className="btn-primary mt-6 text-sm">
                Be the first to report
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item, i) => (
                <div key={item._id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
