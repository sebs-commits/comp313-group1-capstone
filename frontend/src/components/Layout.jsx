import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Trophy, UserPlus, PlusSquare, User, LogOut, Menu } from 'lucide-react';
import { supabase } from '../supabaseClient';

const navItems = [
  { path: '/dashboard',label: 'Dashboard',icon: LayoutDashboard },
  { path: '/livePlayerData',label: 'Live Scores',icon: Activity },
  { path: '/userLeagues',label: 'My Leagues', icon: Trophy },
  { path: '/join-league',label: 'Join League',icon: UserPlus },
  { path: '/create-league',label: 'Create League', icon: PlusSquare },
];

const Layout = ({ children }) => {
  const [open, setOpen] = useState(true);
  const location        = useLocation();
  const navigate        = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className={`drawer min-h-screen bg-base-100 ${open ? 'lg:drawer-open' : ''}`}>
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main content */}
      <div className="drawer-content flex flex-col min-h-screen">
        <div className="navbar bg-base-200 border-b border-base-300">
          <label htmlFor="app-drawer" className="btn btn-ghost btn-sm lg:hidden">
            <Menu size={20} />
          </label>
          <button className="btn btn-ghost btn-sm hidden lg:flex" onClick={() => setOpen(!open)}>
            <Menu size={20} />
          </button>
          <span className="ml-2 font-bold lg:hidden">NBAFL</span>
        </div>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay" />

        <aside className="flex flex-col w-60 min-h-full bg-base-200 border-r border-base-300">
          {/* Logo */}
          <div className="flex items-center gap-3 p-5 border-b border-base-300">
            <span className="text-2xl">🏀</span>
            <div>
              <p className="font-bold text-lg">NBAFL</p>
              <p className="text-xs uppercase tracking-widest text-primary">Fantasy League</p>
            </div>
          </div>

          {/* Nav */}
          <ul className="menu flex-1 gap-1 w-full">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <li key={path}>
                  <Link to={path} className={active ? 'nav-link-active' : 'text-base-content/60'}>
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Footer- logout */}
          <div className="flex items-center gap-2 p-3 border-t border-base-300">
            <Link to="/profile" className="btn btn-ghost btn-sm flex-1 justify-start gap-2 text-base-content/60">
              <User size={15} />
              My Account
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm text-error" title="Log out">
              <LogOut size={15} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;
