import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Trophy,
  UserPlus,
  PlusSquare,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/livePlayerData',      label: 'Live Scores',   icon: Activity },
  { path: '/userLeagues',   label: 'My Leagues',    icon: Trophy },
  { path: '/join-league',    label: 'Join League',   icon: UserPlus },
  { path: '/create-league',  label: 'Create League', icon: PlusSquare },
];

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-ball">🏀</div>
          <div className="brand-text">
            <span className="brand-name">NBAFL</span>
            <span className="brand-sub">Fantasy League</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">MAIN MENU</span>

          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`nav-link${active ? ' nav-link--active' : ''}`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
                {active && <ChevronRight size={14} className="nav-chevron" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              <User size={15} />
            </div>
            <div className="user-info">
              <span className="user-name">My Account</span>
            </div>
            <LogOut size={15} className="logout-icon" />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-wrapper">
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
