import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { supabase } from '../supabaseClient';

const navItems = [
  { path: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/livePlayerData',      label: 'Live Scores',   icon: Activity },
  { path: '/userLeagues',   label: 'My Leagues',    icon: Trophy },
  { path: '/join-league',    label: 'Join League',   icon: UserPlus },
  { path: '/create-league',  label: 'Create League', icon: PlusSquare },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 pb-5 pt-[22px]">
          <div className="text-[26px] leading-none drop-shadow-[0_0_8px_rgba(232,129,58,0.5)]">🏀</div>
          <div className="flex flex-col">
            <span className="text-[25px] font-bold leading-[1.2] tracking-[-0.3px] text-[var(--text-primary)]">NBAFL</span>
            <span className="text-[10px] font-semibold uppercase leading-[1.4] tracking-[1.2px] text-[var(--accent)]">Fantasy League</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-[10px] px-[10px] py-[18px] text-[var(--text-secondary)]"
        style={{ marginTop: '1.5rem'}}>

          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`group relative flex w-full items-center gap-[11px] whitespace-nowrap rounded-[var(--radius)] px-3 py-[10px] text-[15px] font-medium transition-[var(--transition)] ${
                  active
                    ? 'bg-[rgba(232,129,58,0.13)] text-[var(--accent)] hover:bg-[rgba(232,129,58,0.18)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
                }`}
              style={{ paddingRight:'1rem', paddingLeft: '0.5rem'}}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User */}
        <div className="border-t border-[var(--border)] px-[10px] py-[18px]">
          <div className="flex min-h-[52px] items-center gap-[10px] rounded-[var(--radius)] px-[10px] py-[11px]">
            <Link
              to="/profile"
              className="flex flex-1 items-center gap-[10px] rounded-[var(--radius)] transition-[var(--transition)] hover:bg-[var(--bg-card)] px-[6px] py-[6px]"
            >
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[#c8102e] text-white">
                <User size={15} />
              </div>
              <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">My Account</span>
            </Link>
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-[var(--radius)] p-2 text-[var(--text-muted)] transition-[var(--transition)] hover:bg-[var(--bg-card)] hover:text-red-400"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="h-screen min-w-0 flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
