import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  MATCHED:   { label: 'Matched',    cls: 'badge-matched',   icon: '🔗', desc: 'A potential match was found between these items.' },
  REQUESTED: { label: 'Requested',  cls: 'badge-requested', icon: '📬', desc: 'A contact request is pending approval.' },
  APPROVED:  { label: 'Approved',   cls: 'badge-approved',  icon: '✅', desc: 'Contact details have been shared. Time to meet!' },
  REJECTED:  { label: 'Rejected',   cls: 'badge-rejected',  icon: '❌', desc: 'This contact request was declined.' },
  COMPLETED: { label: 'Completed',  cls: 'badge-completed', icon: '🎉', desc: 'Item successfully returned!' },
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <span className={(hover || value) >= star ? 'text-amber-400' : 'text-ink-700'}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function MatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [rating, setRating] = useState(0);

  const fetchMatch = async () => {
    try {
      const { data } = await api.get(`/matches/${id}`);
      setMatch(data);
    } catch {
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatch(); }, [id]);

  if (loading) return <><Navbar /><Spinner fullscreen /></>;
  if (!match) return null;

  const config = STATUS_CONFIG[match.status];
  const isLostUser = match.lostUser?._id === user?._id;
  const isFoundUser = match.foundUser?._id === user?._id;
  const isRequester = match.requestedBy?.toString() === user?._id;
  const isApproved = ['APPROVED', 'COMPLETED'].includes(match.status);

  const myItem = isLostUser ? match.lostItem : match.foundItem;
  const otherItem = isLostUser ? match.foundItem : match.lostItem;
  const otherUser = isLostUser ? match.foundUser : match.lostUser;

  const handleRequest = async () => {
    setActionLoading(true);
    try {
      await api.post(`/matches/${id}/request`);
      toast.success('Contact request sent!');
      fetchMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (action) => {
    setActionLoading(true);
    try {
      await api.post(`/matches/${id}/respond`, { action });
      toast.success(action === 'accept' ? '✅ Request accepted! Contact info shared.' : 'Request rejected.');
      fetchMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHandshake = async () => {
    if (!secretCode.trim()) return toast.error('Enter the secret code');
    setActionLoading(true);
    try {
      await api.post(`/matches/${id}/handshake`, { secretCode: secretCode.trim() });
      toast.success('🎉 Handshake verified! Match completed!');
      fetchMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRate = async () => {
    if (!rating) return toast.error('Please select a rating');
    setActionLoading(true);
    try {
      const { data } = await api.post(`/matches/${id}/rate`, { rating });
      toast.success(data.message);
      fetchMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rating failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/matches')} className="btn-ghost text-sm mb-6 -ml-2">← All Matches</button>

        {/* Status header */}
        <div className="card p-6 mb-6 animate-fade-up">
          <div className="flex items-center gap-3 mb-3">
            <span className={config.cls}>{config.icon} {config.label}</span>
            <span className="text-xs font-mono text-ink-500">{match.matchScore}% confidence</span>
          </div>
          <p className="text-sm text-ink-400">{config.desc}</p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center gap-1">
              {['MATCHED', 'REQUESTED', 'APPROVED', 'COMPLETED'].map((s, i) => {
                const statuses = ['MATCHED', 'REQUESTED', 'APPROVED', 'COMPLETED'];
                const currentIdx = statuses.indexOf(match.status === 'REJECTED' ? 'REQUESTED' : match.status);
                const isActive = i <= currentIdx;
                return (
                  <div key={s} className="flex-1 flex items-center gap-1">
                    <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${isActive ? 'bg-amber-400' : 'bg-ink-700'}`} />
                    {i < 3 && <div className={`w-2 h-2 rounded-full shrink-0 ${i < currentIdx ? 'bg-amber-400' : 'bg-ink-700'}`} />}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              {['Matched', 'Requested', 'Approved', 'Done'].map(l => (
                <span key={l} className="text-[9px] font-mono text-ink-600">{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Items comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {[
            { item: myItem, label: isLostUser ? 'Your Lost Item' : 'Item You Found', mine: true },
            { item: otherItem, label: isLostUser ? 'Matched Found Item' : 'Lost Item Report', mine: false },
          ].map(({ item, label, mine }) => (
            <div key={label} className={`card p-4 ${mine ? 'border-amber-400/30' : ''}`}>
              <p className="section-title mb-3">{label}</p>
              <div className="aspect-video bg-ink-700 rounded-lg overflow-hidden mb-3">
                {item?.images?.[0] ? (
                  <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📦</div>
                )}
              </div>
              <p className="font-display font-bold text-sm text-ink-100 truncate">{item?.title}</p>
              <p className="text-xs text-ink-500 truncate mt-1">{item?.location}</p>
              {isApproved && (
                <div className="mt-2 p-2 bg-signal-green/10 rounded-lg border border-signal-green/20">
                  <p className="text-xs font-mono text-signal-green">📞 {item?.contactPhone}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Other user info */}
        <div className="card p-4 mb-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <p className="section-title mb-3">Other Party</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-ink-700 border border-ink-600">
              {otherUser?.profileImage ? (
                <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-ink-200">
                  {otherUser?.name?.[0]}
                </div>
              )}
            </div>
            <div>
              <p className="font-display font-semibold text-ink-100">{otherUser?.name}</p>
              {otherUser?.stars > 0 && <p className="text-xs text-amber-400 font-mono">⭐ {otherUser.stars} stars</p>}
            </div>
            {isApproved && otherUser?.phone && (
              <div className="ml-auto bg-signal-green/10 border border-signal-green/30 rounded-lg px-3 py-1.5">
                <p className="text-xs font-mono text-signal-green">📞 {otherUser.phone}</p>
              </div>
            )}
          </div>
          {!isApproved && (
            <p className="text-xs text-ink-600 font-mono mt-3 flex items-center gap-1">
              🔒 Contact details revealed after approval
            </p>
          )}
        </div>

        {/* Action Panel */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>

          {/* MATCHED → Request contact */}
          {match.status === 'MATCHED' && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-ink-50 mb-2">Request Contact Info</h3>
              <p className="text-sm text-ink-400 mb-4">
                Send a request to share contact details with the other party. They'll be notified and can accept or decline.
              </p>
              <button onClick={handleRequest} disabled={actionLoading} className="btn-primary w-full">
                {actionLoading ? 'Sending…' : '📬 Request Contact Info'}
              </button>
            </div>
          )}

          {/* REQUESTED → different views */}
          {match.status === 'REQUESTED' && (
            <div className="card p-5">
              {isRequester ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">⏳</div>
                  <h3 className="font-display font-bold text-ink-50 mb-2">Request Pending</h3>
                  <p className="text-sm text-ink-400">Waiting for the other party to respond to your contact request.</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-display font-bold text-ink-50 mb-2">📬 Contact Request Received</h3>
                  <p className="text-sm text-ink-400 mb-5">
                    The other party wants to share contact info. Accept to reveal each other's phone numbers and arrange a meeting.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRespond('reject')}
                      disabled={actionLoading}
                      className="btn-danger text-sm py-3"
                    >
                      ❌ Decline
                    </button>
                    <button
                      onClick={() => handleRespond('accept')}
                      disabled={actionLoading}
                      className="btn-primary text-sm py-3"
                    >
                      {actionLoading ? '…' : '✅ Accept'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* APPROVED → Handshake (lost user only) */}
          {match.status === 'APPROVED' && isLostUser && !match.ratingGiven && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-ink-50 mb-2">🤝 Verify Handshake</h3>
              <p className="text-sm text-ink-400 mb-4">
                After meeting with the finder, ask them for the secret code and enter it below to complete the return.
              </p>
              <div className="mb-4">
                <label className="label">Secret Code</label>
                <input
                  type="text"
                  placeholder="Enter 8-character code"
                  value={secretCode}
                  onChange={e => setSecretCode(e.target.value.toUpperCase().slice(0, 8))}
                  className="input font-mono text-center text-xl tracking-[0.4em] uppercase"
                  maxLength={8}
                />
              </div>
              <button onClick={handleHandshake} disabled={actionLoading || secretCode.length < 4} className="btn-primary w-full">
                {actionLoading ? 'Verifying…' : '🔐 Verify & Complete'}
              </button>
            </div>
          )}

          {/* APPROVED — Found user waiting */}
          {match.status === 'APPROVED' && isFoundUser && (
            <div className="card p-5 text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="font-display font-bold text-ink-50 mb-2">Share Your Secret Code</h3>
              <p className="text-sm text-ink-400">
                Contact the other party using the details above. When you meet, give them the secret code you received when you reported the found item to complete the handshake.
              </p>
            </div>
          )}

          {/* COMPLETED → Rating */}
          {match.status === 'COMPLETED' && isLostUser && !match.ratingGiven && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-ink-50 mb-2">⭐ Rate the Finder</h3>
              <p className="text-sm text-ink-400 mb-4">How was your experience? Your rating helps build community trust.</p>
              <div className="flex justify-center mb-5">
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5 text-center text-xs text-ink-500 font-mono">
                <div className={`p-2 rounded-lg ${rating < 3 && rating > 0 ? 'bg-signal-red/10 text-signal-red' : 'bg-ink-800'}`}>1-2 → 0 stars</div>
                <div className={`p-2 rounded-lg ${rating >= 3 && rating < 5 ? 'bg-signal-green/10 text-signal-green' : 'bg-ink-800'}`}>3-4 → +1 ⭐</div>
                <div className={`p-2 rounded-lg ${rating === 5 ? 'bg-amber-400/10 text-amber-400' : 'bg-ink-800'}`}>5 → +2 ⭐</div>
              </div>
              <button onClick={handleRate} disabled={!rating || actionLoading} className="btn-primary w-full">
                {actionLoading ? 'Submitting…' : `Submit Rating (${rating || '?'}/5)`}
              </button>
            </div>
          )}

          {/* COMPLETED */}
          {match.status === 'COMPLETED' && (match.ratingGiven || isFoundUser) && (
            <div className="card p-5 text-center bg-signal-green/5 border-signal-green/20">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-display font-bold text-ink-50 mb-2">Match Completed!</h3>
              <p className="text-sm text-ink-400">
                This item has been successfully returned. Thank you for making a difference in your community!
              </p>
            </div>
          )}

          {/* REJECTED */}
          {match.status === 'REJECTED' && (
            <div className="card p-5 text-center">
              <div className="text-4xl mb-3">❌</div>
              <p className="text-sm text-ink-400">This contact request was declined. The match remains open — you can report another item if needed.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
