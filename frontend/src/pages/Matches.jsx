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
    api.get('/matches')
      .then(({ data }) => setMatches(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeStatus === 'ALL'
    ? matches
    : matches.filter(m => m.status === activeStatus);

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? matches.length : matches.filter(m => m.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <p className="section-title mb-1">My Activity</p>
          <h1 className="page-header">Matches</h1>
          <p className="text-ink-400 mt-2 text-sm">
            Track your item matches, contact requests, and handshakes.
          </p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all ${
                activeStatus === s
                  ? 'bg-amber-400 text-ink-900 font-semibold'
                  : 'bg-ink-800 text-ink-400 hover:bg-ink-700 border border-ink-700'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
              {counts[s] > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeStatus === s ? 'bg-ink-900/20 text-ink-900' : 'bg-ink-700 text-ink-300'
                }`}>
                  {counts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center animate-fade-up">
            <div className="text-5xl mb-4 opacity-30">🔗</div>
            <p className="text-ink-500 font-mono text-sm mb-2">
              {activeStatus === 'ALL' ? 'No matches yet' : `No ${activeStatus.toLowerCase()} matches`}
            </p>
            <p className="text-ink-600 text-xs">
              Matches are created automatically when items share category, keywords, and location.
            </p>
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
