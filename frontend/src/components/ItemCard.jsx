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
    <div onClick={() => navigate(`/items/${item._id}`)} className="card-hover group animate-fade-up">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden rounded-t-xl">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">{CATEGORY_ICONS[item.category] || '📦'}</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className={isLost ? 'badge-lost' : 'badge-found'}>
            {isLost ? '⚠ Lost' : '✓ Found'}
          </span>
        </div>
        {item.images?.length > 1 && (
          <div className="absolute top-2.5 right-2.5 bg-black/40 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            +{item.images.length - 1}
          </div>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 flex-1">{item.title}</h3>
          <span className="text-base shrink-0">{CATEGORY_ICONS[item.category]}</span>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="truncate max-w-[110px]">{item.location}</span>
          </div>
          <div className="flex items-center gap-1">
            {item.reportedBy?.profileImage
              ? <img src={item.reportedBy.profileImage} alt="" className="w-4 h-4 rounded-full object-cover"/>
              : <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-blue-600">{item.reportedBy?.name?.[0]}</span>
                </div>
            }
            {item.reportedBy?.stars > 0 && <span className="text-amber-500">⭐{item.reportedBy.stars}</span>}
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span>
        </div>
      </div>
    </div>
  );
}