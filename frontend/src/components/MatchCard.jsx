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

  const myItem = isLostUser ? match.lostItem : match.foundItem;
  const otherItem = isLostUser ? match.foundItem : match.lostItem;
  const otherUser = isLostUser ? match.foundUser : match.lostUser;

  return (
    <div
      onClick={() => navigate(`/matches/${match._id}`)}
      className="card-hover p-4 animate-fade-up"
    >
      <div className="flex items-start gap-4">
        {/* Items preview */}
        <div className="flex -space-x-3 shrink-0">
          {[myItem, otherItem].map((item, i) => (
            <div key={i} className={`w-12 h-12 rounded-xl overflow-hidden border-2 border-ink-800 ${i === 0 ? 'z-10' : ''}`}>
              {item?.images?.[0] ? (
                <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-ink-700 flex items-center justify-center text-xl">
                  {i === 0 ? '📦' : '🔍'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={config.cls}>{config.icon} {config.label}</span>
            <span className="text-xs font-mono text-ink-500">{match.matchScore}% match</span>
          </div>

          <p className="font-display font-semibold text-ink-50 text-sm line-clamp-1">
            {myItem?.title} ↔ {otherItem?.title}
          </p>

          <div className="flex items-center gap-1 mt-1">
            {otherUser?.profileImage ? (
              <img src={otherUser.profileImage} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-ink-600 flex items-center justify-center">
                <span className="text-[8px] font-bold">{otherUser?.name?.[0]}</span>
              </div>
            )}
            <span className="text-xs text-ink-400">{otherUser?.name}</span>
            {otherUser?.stars > 0 && <span className="text-xs text-amber-400">⭐{otherUser.stars}</span>}
          </div>
        </div>

        {/* Arrow */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-600 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-ink-700 flex items-center justify-between text-xs text-ink-600 font-mono">
        <span>
          {isLostUser ? '🔍 You lost this' : '✅ You found this'}
        </span>
        <span>{new Date(match.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}
