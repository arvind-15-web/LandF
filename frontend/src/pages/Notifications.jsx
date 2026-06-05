import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  match_found:        '🎯',
  contact_request:    '📬',
  request_accepted:   '✅',
  request_rejected:   '❌',
  handshake_complete: '🎉',
};

const TYPE_COLORS = {
  match_found:        'bg-blue-50 border-blue-100',
  contact_request:    'bg-orange-50 border-orange-100',
  request_accepted:   'bg-green-50 border-green-100',
  request_rejected:   'bg-red-50 border-red-100',
  handshake_complete: 'bg-amber-50 border-amber-100',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications?limit=50')
      .then(({ data }) => { setNotifications(data.notifications); setUnread(data.unreadCount); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
      toast.success('All marked as read');
    } catch {}
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      try { await api.patch(`/notifications/${notif._id}/read`); } catch {}
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    }
    if (notif.link) navigate(notif.link);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
    const d = Math.floor(h / 24);
    return `${d} day${d > 1 ? 's' : ''} ago`;
  };

  const grouped = notifications.reduce((acc, n) => {
    const d = new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(n);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Updates</p>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm py-2">
              Mark all read
            </button>
          )}
        </div>

        {loading ? <Spinner /> : notifications.length === 0 ? (
          <div className="card p-14 text-center">
            <div className="text-5xl mb-4 opacity-20">🔔</div>
            <p className="text-slate-400 text-sm mb-1">No notifications yet</p>
            <p className="text-slate-300 text-xs">You'll be notified when items match, contact requests arrive, and more.</p>
          </div>
        ) : (
          <div className="space-y-7 animate-fade-up">
            {Object.entries(grouped).map(([date, notifs]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{date}</p>
                <div className="space-y-2">
                  {notifs.map(n => (
                    <button key={n._id} onClick={() => handleClick(n)}
                      className={`w-full text-left card p-4 hover:shadow-card-md transition-all group ${!n.read ? 'border-blue-200 bg-blue-50/40' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                          TYPE_COLORS[n.type] || 'bg-slate-50 border-slate-100'
                        }`}>
                          {TYPE_ICONS[n.type] || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </p>
                            {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1" />}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                        </div>
                        {n.link && (
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m9 18 6-6-6-6"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}