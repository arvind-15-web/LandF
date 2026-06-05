import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  MATCHED:   { label: 'Matched',   cls: 'badge-matched',   icon: '🔗' },
  REQUESTED: { label: 'Requested', cls: 'badge-requested', icon: '📬' },
  APPROVED:  { label: 'Approved',  cls: 'badge-approved',  icon: '✅' },
  REJECTED:  { label: 'Rejected',  cls: 'badge-rejected',  icon: '❌' },
  COMPLETED: { label: 'Completed', cls: 'badge-completed', icon: '🎉' },
};

export default function MatchCard({ match, currentUserId }) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[match.status] || STATUS_CONFIG.MATCHED;
  const isLostUser = match.lostUser?._id === currentUserId;
  const myItem    = isLostUser ? match.lostItem  : match.foundItem;
  const otherItem = isLostUser ? match.foundItem : match.lostItem;
  const otherUser = isLostUser ? match.foundUser : match.lostUser;

  return (
    <div onClick={() => navigate(`/matches/${match._id}`)} className="card-hover p-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3 shrink-0">
          {[myItem, otherItem].map((item, i) => (
            <div key={i} className={`w-11 h-11 rounded-xl overflow-hidden border-2 border-white shadow-sm ${i === 0 ? 'z-10' : ''}`}>
              {item?.images?.[0]
                ? <img src={item.images[0]} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-lg">{i === 0 ? '📦' : '🔍'}</div>
              }
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={config.cls}>{config.icon} {config.label}</span>
            <span className="text-xs text-slate-400 font-medium">{match.matchScore}% match</span>
          </div>
          <p className="font-semibold text-slate-900 text-sm truncate">
            {myItem?.title} <span className="text-slate-400">↔</span> {otherItem?.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {otherUser?.profileImage
              ? <img src={otherUser.profileImage} alt="" className="w-3.5 h-3.5 rounded-full object-cover"/>
              : <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-blue-600">{otherUser?.name?.[0]}</span>
                </div>
            }
            <span className="text-xs text-slate-400">{otherUser?.name}</span>
          </div>
        </div>

        <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className={isLostUser ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
          {isLostUser ? '⚠ You lost this' : '✓ You found this'}
        </span>
        <span>{new Date(match.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}