import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Zap, Search, Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, profile, loginWithGoogle, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/search' },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
    { icon: User, label: 'Profile', path: user ? `/profile/${user.uid}` : '/auth' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-nexus-accent rounded-xl grid place-items-center text-white shadow-lg shadow-nexus-accent/20">
            <Zap size={24} fill="currentColor" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">Nexus</span>
        </Link>

        <div className="hidden items-center space-x-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                location.pathname === item.path 
                  ? "bg-nexus-accent/10 text-nexus-accent" 
                  : "text-nexus-dim hover:text-nexus-text hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <button
                onClick={logout}
                className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-nexus-dim hover:text-red-500 hover:bg-red-500/10 transition-all duration-300"
              >
                <LogOut size={18} />
              </button>
              <Link to={`/profile/${user.uid}`} className="flex items-center gap-3 group">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-bold leading-tight group-hover:text-nexus-accent transition-colors">{profile?.username}</div>
                  <div className="text-[10px] text-nexus-dim uppercase tracking-widest font-medium">@active</div>
                </div>
                <img
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt={profile?.username ? `${profile.username}'s profile picture` : 'User profile picture'}
                  className="h-10 w-10 rounded-full ring-2 ring-nexus-border ring-offset-4 ring-offset-nexus-bg object-cover group-hover:ring-nexus-accent transition-all duration-300"
                />
              </Link>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="rounded-full bg-nexus-accent px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-nexus-accent/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
