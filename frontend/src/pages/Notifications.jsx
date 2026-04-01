import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  match_found: '🎯',
  contact_request: '📬',
  request_accepted: '✅',
  request_rejected: '❌',
  handshake_complete: '🎉',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications?limit=50');
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

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

  // Group by date
  const grouped = notifications.reduce((acc, n) => {
    const d = new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(n);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <p className="section-title mb-1">Updates</p>
            <h1 className="page-header">Notifications</h1>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-ghost text-sm text-amber-400 hover:text-amber-500">
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : notifications.length === 0 ? (
          <div className="card p-16 text-center animate-fade-up">
            <div className="text-5xl mb-4 opacity-20">🔔</div>
            <p className="text-ink-500 font-mono text-sm">No notifications yet</p>
            <p className="text-ink-600 text-xs mt-2">
              You'll be notified when items match, contact requests arrive, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {Object.entries(grouped).map(([date, notifs]) => (
              <div key={date}>
                <p className="section-title mb-3">{date}</p>
                <div className="space-y-2">
                  {notifs.map(n => (
                    <button
                      key={n._id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left card p-4 hover:border-ink-500 transition-all group ${
                        !n.read ? 'border-amber-400/20 bg-amber-400/3' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          !n.read ? 'bg-amber-400/15' : 'bg-ink-700'
                        }`}>
                          {TYPE_ICONS[n.type] || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-display font-semibold text-sm ${!n.read ? 'text-ink-50' : 'text-ink-200'}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <div className="w-2 h-2 bg-amber-400 rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-ink-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-ink-600 font-mono mt-2">{timeAgo(n.createdAt)}</p>
                        </div>
                        {n.link && (
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-600 group-hover:text-ink-400 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m9 18 6-6-6-6" />
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
