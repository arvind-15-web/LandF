import { useNavigate } from 'react-router-dom';

const CATEGORY_ICONS = {
  wallet: '👜', phone: '📱', documents: '📄', keys: '🔑',
  bag: '🎒', jewelry: '💍', electronics: '💻', clothing: '👕',
  pet: '🐾', other: '📦',
};

export default function ItemCard({ item }) {
  const navigate = useNavigate();
  const isLost = item.type === 'lost';

  return (
    <div
      onClick={() => navigate(`/items/${item._id}`)}
      className="card-hover group animate-fade-up"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-ink-700 overflow-hidden">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-40">{CATEGORY_ICONS[item.category] || '📦'}</span>
          </div>
        )}

        {/* Type badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={isLost ? 'badge-lost' : 'badge-found'}>
            {isLost ? '⚠ Lost' : '✓ Found'}
          </span>
        </div>

        {/* Multiple images indicator */}
        {item.images?.length > 1 && (
          <div className="absolute top-3 right-3 bg-ink-900/70 text-ink-200 text-xs font-mono px-2 py-1 rounded-full">
            +{item.images.length - 1}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-bold text-ink-50 leading-tight line-clamp-1 flex-1">
            {item.title}
          </h3>
          <span className="text-lg shrink-0">{CATEGORY_ICONS[item.category]}</span>
        </div>

        <p className="text-sm text-ink-400 line-clamp-2 mb-3">{item.description}</p>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-ink-500">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate max-w-[120px]">{item.location}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {item.reportedBy?.profileImage ? (
              <img src={item.reportedBy.profileImage} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-ink-600 flex items-center justify-center">
                <span className="text-[9px] font-bold">{item.reportedBy?.name?.[0] || '?'}</span>
              </div>
            )}
            <span className="text-ink-500 truncate max-w-[80px]">{item.reportedBy?.name?.split(' ')[0]}</span>
            {item.reportedBy?.stars > 0 && (
              <span className="text-amber-400 font-mono">⭐{item.reportedBy.stars}</span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-ink-700 flex items-center justify-between text-xs text-ink-600 font-mono">
          <span>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <span className="capitalize">{item.category}</span>
        </div>
      </div>
    </div>
  );
}
