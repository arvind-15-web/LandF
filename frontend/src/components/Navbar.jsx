import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = [{ to: '/dashboard', label: 'Dashboard' }, { to: '/matches', label: 'Matches' }];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <span className="font-bold text-slate-900">Lost<span className="text-blue-600">&</span>Found</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname.startsWith(to)
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <NotificationBell />
          <button onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all group">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-slate-200 group-hover:ring-blue-400 transition-all">
              {user?.profileImage
                ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
                  </div>}
            </div>
            <span className="hidden md:block text-sm font-medium text-slate-600 group-hover:text-slate-900 max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>

      <div className="md:hidden border-t border-slate-100 px-4 py-1.5 flex gap-1">
        {links.map(({ to, label }) => (
          <Link key={to} to={to}
            className={`flex-1 text-center py-1.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname.startsWith(to) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500'
            }`}>
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}