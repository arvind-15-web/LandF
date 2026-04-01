import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/matches', label: 'Matches' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-ink-900/90 backdrop-blur-md border-b border-ink-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#0D0D0D" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-ink-50 tracking-tight">
            Lost<span className="text-amber-400">&</span>Found
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg font-display font-semibold text-sm transition-all duration-150 ${
                location.pathname.startsWith(to)
                  ? 'bg-ink-700 text-ink-50'
                  : 'text-ink-400 hover:text-ink-50 hover:bg-ink-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          {/* Profile avatar */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-ink-800 transition-all group"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-ink-700 group-hover:ring-amber-400/50 transition-all">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-ink-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-ink-200">
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <span className="hidden md:block text-sm font-display font-semibold text-ink-200 group-hover:text-ink-50 transition-colors max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-ink-800 px-4 py-2 flex gap-2">
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 text-center py-2 rounded-lg font-display font-semibold text-sm transition-all ${
              location.pathname.startsWith(to)
                ? 'bg-ink-700 text-ink-50'
                : 'text-ink-400 hover:text-ink-50'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
