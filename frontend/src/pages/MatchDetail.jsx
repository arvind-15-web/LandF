import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  MATCHED:   { label: 'Matched',   cls: 'badge-matched',   icon: '🔗', desc: 'A potential match was found between these items.' },
  REQUESTED: { label: 'Requested', cls: 'badge-requested', icon: '📬', desc: 'A contact request is pending approval.' },
  APPROVED:  { label: 'Approved',  cls: 'badge-approved',  icon: '✅', desc: 'Contact details shared. Time to meet!' },
  REJECTED:  { label: 'Rejected',  cls: 'badge-rejected',  icon: '❌', desc: 'This contact request was declined.' },
  COMPLETED: { label: 'Completed', cls: 'badge-completed', icon: '🎉', desc: 'Item successfully returned!' },
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110">
          <span className={(hover || value) >= star ? 'text-amber-400' : 'text-slate-200'}>★</span>
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
    try { const { data } = await api.get(`/matches/${id}`); setMatch(data); }
    catch { navigate('/matches'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMatch(); }, [id]);

  if (loading) return <><Navbar /><Spinner fullscreen /></>;
  if (!match) return null;

  const config = STATUS_CONFIG[match.status];
  const isLostUser  = match.lostUser?._id === user?._id;
  const isFoundUser = match.foundUser?._id === user?._id;
  const isRequester = match.requestedBy?.toString() === user?._id;
  const isApproved  = ['APPROVED', 'COMPLETED'].includes(match.status);
  const myItem    = isLostUser ? match.lostItem  : match.foundItem;
  const otherItem = isLostUser ? match.foundItem : match.lostItem;
  const otherUser = isLostUser ? match.foundUser : match.lostUser;

  const doAction = async (fn) => { setActionLoading(true); try { await fn(); } finally { setActionLoading(false); } };

  const handleRequest = () => doAction(async () => {
    await api.post(`/matches/${id}/request`);
    toast.success('Contact request sent!'); fetchMatch();
  });

  const handleRespond = (action) => doAction(async () => {
    await api.post(`/matches/${id}/respond`, { action });
    toast.success(action === 'accept' ? '✅ Request accepted!' : 'Request rejected.'); fetchMatch();
  });

  const handleHandshake = () => doAction(async () => {
    if (!secretCode.trim()) { toast.error('Enter the secret code'); return; }
    await api.post(`/matches/${id}/handshake`, { secretCode: secretCode.trim() });
    toast.success('🎉 Handshake verified! Match completed!'); fetchMatch();
  });

  const handleRate = () => doAction(async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    const { data } = await api.post(`/matches/${id}/rate`, { rating });
    toast.success(data.message); fetchMatch();
  });

  const handleGenerateCode = () => doAction(async () => {
    await api.post(`/matches/${id}/generate-code`);
    toast.success('🎉 Secret code generated!');
    fetchMatch();
  });

  const statuses = ['MATCHED', 'REQUESTED', 'APPROVED', 'COMPLETED'];
  const currentIdx = statuses.indexOf(match.status === 'REJECTED' ? 'REQUESTED' : match.status);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/matches')} className="btn-ghost text-sm mb-5 -ml-1">← All Matches</button>

        {/* Status */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={config.cls}>{config.icon} {config.label}</span>
            <span className="text-xs text-slate-400">{match.matchScore}% confidence</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">{config.desc}</p>
          <div className="flex items-center gap-1.5">
            {statuses.map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= currentIdx ? 'bg-blue-500' : 'bg-slate-200'}`}/>
                {i < 3 && <div className={`w-2 h-2 rounded-full shrink-0 ${i < currentIdx ? 'bg-blue-500' : 'bg-slate-200'}`}/>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['Matched','Requested','Approved','Done'].map(l => (
              <span key={l} className="text-[9px] text-slate-400">{l}</span>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[{item: myItem, label: isLostUser ? 'Your Lost Item' : 'Item You Found', mine: true},
            {item: otherItem, label: isLostUser ? 'Matched Found Item' : 'Lost Item Report', mine: false}
          ].map(({ item, label, mine }) => (
            <div key={label} className={`card p-4 ${mine ? 'border-blue-200' : ''}`}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden mb-2.5">
                {item?.images?.[0]
                  ? <img src={item.images[0]} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📦</div>}
              </div>
              <p className="font-semibold text-sm text-slate-800 truncate">{item?.title}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{item?.location}</p>
              {isApproved && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-medium text-green-700">📞 {item?.contactPhone}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Other user */}
        <div className="card p-4 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Other Party</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 border border-slate-200 flex items-center justify-center">
              {otherUser?.profileImage
                ? <img src={otherUser.profileImage} alt="" className="w-full h-full object-cover"/>
                : <span className="text-sm font-bold text-blue-600">{otherUser?.name?.[0]}</span>}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{otherUser?.name}</p>
              {otherUser?.stars > 0 && <p className="text-xs text-amber-500">⭐ {otherUser.stars} stars</p>}
            </div>
            {isApproved && otherUser?.phone && (
              <div className="ml-auto bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                <p className="text-xs font-medium text-green-700">📞 {otherUser.phone}</p>
              </div>
            )}
          </div>
          {!isApproved && (
            <p className="text-xs text-slate-400 mt-2.5">🔒 Contact details revealed after approval</p>
          )}
        </div>

        {/* Actions */}
        {match.status === 'MATCHED' && (
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-1">Request Contact Info</h3>
            <p className="text-sm text-slate-500 mb-4">Send a request to share contact details. The other party can accept or decline.</p>
            <button onClick={handleRequest} disabled={actionLoading} className="btn-primary w-full">
              {actionLoading ? 'Sending…' : '📬 Request Contact Info'}
            </button>
          </div>
        )}

        {match.status === 'REQUESTED' && (
          <div className="card p-5">
            {isRequester ? (
              <div className="text-center py-3">
                <div className="text-4xl mb-3">⏳</div>
                <h3 className="font-bold text-slate-800 mb-1">Request Pending</h3>
                <p className="text-sm text-slate-500">Waiting for the other party to respond.</p>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-slate-800 mb-1">📬 Contact Request Received</h3>
                <p className="text-sm text-slate-500 mb-4">Accept to reveal each other's phone numbers and arrange a meeting.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleRespond('reject')} disabled={actionLoading} className="btn-danger py-2.5">❌ Decline</button>
                  <button onClick={() => handleRespond('accept')} disabled={actionLoading} className="btn-green py-2.5">✅ Accept</button>
                </div>
              </div>
            )}
          </div>
        )}

        {match.status === 'APPROVED' && isLostUser && (
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-1">🤝 Verify Handshake</h3>
            <p className="text-sm text-slate-500 mb-4">Ask the finder for their secret code after meeting, then enter it below.</p>
            <div className="mb-4">
              <label className="label">Secret Code</label>
              <input type="text" placeholder="Enter 8-character code"
                value={secretCode} onChange={e => setSecretCode(e.target.value.toUpperCase().slice(0,8))}
                className="input text-center text-xl tracking-[0.4em] uppercase font-mono py-3" maxLength={8}/>
            </div>
            <button onClick={handleHandshake} disabled={actionLoading || secretCode.length < 4} className="btn-primary w-full">
              {actionLoading ? 'Verifying…' : '🔐 Verify & Complete'}
            </button>
          </div>
        )}

        {match.status === 'APPROVED' && isFoundUser && (
          <div className="card p-5 text-center space-y-4">
            <div className="text-4xl mb-1">🤝</div>
            <h3 className="font-bold text-slate-800">Your Secret Verification Code</h3>
            
            {match.foundItem?.secretCodePlain ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Give this code to the lost item owner when you meet. They will enter it to verify and complete the handover.
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-6 py-4 max-w-xs mx-auto">
                  <span className="text-2xl font-extrabold text-blue-700 tracking-[0.3em] font-mono">
                    {match.foundItem.secretCodePlain}
                  </span>
                </div>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(match.foundItem.secretCodePlain); toast.success('Copied!'); }}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    📋 Copy Code
                  </button>
                  <button 
                    onClick={handleGenerateCode} 
                    disabled={actionLoading} 
                    className="btn-ghost text-xs text-red-500 py-2 px-4 border border-red-200 hover:bg-red-50"
                  >
                    🔄 Regenerate Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Generate a secret code to securely verify the handover during your physical meeting.
                </p>
                <button onClick={handleGenerateCode} disabled={actionLoading} className="btn-primary w-full py-2.5">
                  {actionLoading ? 'Generating…' : '🔐 Generate Secret Code'}
                </button>
              </div>
            )}
          </div>
        )}

        {match.status === 'COMPLETED' && isLostUser && !match.ratingGiven && (
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-1">⭐ Rate the Finder</h3>
            <p className="text-sm text-slate-500 mb-4">How was your experience? Ratings build community trust.</p>
            <div className="flex justify-center mb-4"><StarRating value={rating} onChange={setRating}/></div>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
              <div className={`p-2 rounded-lg border ${rating < 3 && rating > 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>1-2 → 0 ⭐</div>
              <div className={`p-2 rounded-lg border ${rating >= 3 && rating < 5 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>3-4 → +1 ⭐</div>
              <div className={`p-2 rounded-lg border ${rating === 5 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>5 → +2 ⭐</div>
            </div>
            <button onClick={handleRate} disabled={!rating || actionLoading} className="btn-primary w-full">
              {actionLoading ? 'Submitting…' : `Submit Rating (${rating || '?'}/5)`}
            </button>
          </div>
        )}

        {match.status === 'COMPLETED' && (match.ratingGiven || isFoundUser) && (
          <div className="card p-5 text-center bg-green-50 border-green-200">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-bold text-slate-800 mb-1">Match Completed!</h3>
            <p className="text-sm text-slate-500">Item successfully returned. Thank you for helping your community!</p>
          </div>
        )}

        {match.status === 'REJECTED' && (
          <div className="card p-5 text-center">
            <div className="text-4xl mb-3">❌</div>
            <p className="text-sm text-slate-500">This contact request was declined.</p>
          </div>
        )}
      </main>
    </div>
  );
}