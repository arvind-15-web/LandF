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

  useEffect(() => { fetchItems(); }, [activeTab, category]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: activeTab, limit: 24 });
      if (category !== 'all') params.set('category', category);
      const { data } = await api.get(`/items?${params}`);
      setItems(data.items);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = search.trim()
    ? items.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* Welcome */}
        <div className="mb-6 animate-fade-up">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-up">
          <button onClick={() => navigate('/report/lost')}
            className="card p-5 text-left hover:shadow-card-md hover:border-red-200 transition-all group">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">⚠</div>
            <h3 className="font-bold text-slate-800 mb-0.5">Report Lost Item</h3>
            <p className="text-sm text-slate-400">Something missing? Get help finding it.</p>
          </button>
          <button onClick={() => navigate('/report/found')}
            className="card p-5 text-left hover:shadow-card-md hover:border-green-200 transition-all group">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">✅</div>
            <h3 className="font-bold text-slate-800 mb-0.5">Report Found Item</h3>
            <p className="text-sm text-slate-400">Found something? Help return it.</p>
          </button>
        </div>

        {/* Browse */}
        <div className="animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              {['lost', 'found'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                    activeTab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {t === 'lost' ? '⚠ Lost' : '✓ Found'}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9 py-2 w-full sm:w-52"/>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  category === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : filtered.length === 0 ? (
            <div className="card p-14 text-center">
              <div className="text-5xl mb-4 opacity-20">{activeTab === 'lost' ? '🔍' : '📦'}</div>
              <p className="text-slate-400 text-sm mb-4">
                {search ? 'No items match your search' : `No ${activeTab} items reported yet`}
              </p>
              <button onClick={() => navigate(`/report/${activeTab}`)} className="btn-primary text-sm py-2">
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