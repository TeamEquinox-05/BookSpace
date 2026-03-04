import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const PageHeader = ({ title, subtitle, children }) => {
  const { darkMode, themeMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSettings = () => {
    setIsDropdownOpen(false);
    navigate('/settings');
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') {
      return { icon: <Monitor size={16} />, tooltip: `System theme (currently ${darkMode ? 'dark' : 'light'})` };
    } else if (darkMode) {
      return { icon: <Sun size={16} />, tooltip: 'Switch to light mode' };
    } else {
      return { icon: <Moon size={16} />, tooltip: 'Switch to dark mode' };
    }
  };

  const { icon, tooltip } = getThemeIcon();

  const initials = (user?.name || ' ')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Member';

  return (
    <header className="bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-[#1a1a1a] sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">

        {/* Left — Page Title */}
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-zinc-500 truncate hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-4 flex-shrink-0">
          {children}

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            title={tooltip}
            aria-label={tooltip}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            {icon}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 dark:bg-[#1a1a1a] mx-1" />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors group"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs leading-none">{initials}</span>
              </div>
              {/* Name + Role (hidden on small screens) */}
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium text-slate-800 dark:text-white max-w-[120px] truncate">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{roleLabel}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl border border-slate-200 dark:border-[#1a1a1a] overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100 dark:border-[#1a1a1a]">
                  <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm leading-none">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="px-4 py-2 border-b border-slate-100 dark:border-[#1a1a1a]">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user?.role === 'admin'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-[#1a1a1a] dark:text-zinc-400'
                  }`}>
                    {roleLabel}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleSettings}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <Settings size={15} className="text-slate-400 dark:text-zinc-500" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut size={15} className="text-red-500 dark:text-red-400" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;