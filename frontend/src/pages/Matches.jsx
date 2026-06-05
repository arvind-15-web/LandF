import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import Spinner from '../components/Spinner';
import api from '../api/axios';

const STATUS_TABS = ['ALL', 'MATCHED', 'REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED'];

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL');

  useEffect(() => {
    api.get('/matches').then(({ data }) => setMatches(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = activeStatus === 'ALL' ? matches : matches.filter(m => m.status === activeStatus);
  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? matches.length : matches.filter(m => m.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Activity</p>
          <h1 className="text-2xl font-bold text-slate-900">My Matches</h1>
          <p className="text-sm text-slate-500 mt-1">Track matches, contact requests, and handshakes.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                activeStatus === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
              {counts[s] > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeStatus === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{counts[s]}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="card p-14 text-center">
            <div className="text-5xl mb-4 opacity-20">🔗</div>
            <p className="text-slate-400 text-sm">
              {activeStatus === 'ALL' ? 'No matches yet' : `No ${activeStatus.toLowerCase()} matches`}
            </p>
            <p className="text-slate-300 text-xs mt-1">Matches are created automatically when items share category, keywords, and location.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((match, i) => (
              <div key={match._id} style={{ animationDelay: `${i * 0.05}s` }}>
                <MatchCard match={match} currentUserId={user?._id} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}