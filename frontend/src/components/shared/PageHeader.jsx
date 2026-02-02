import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const PageHeader = ({ title, children }) => {
  const { darkMode, themeMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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

  // Note: Theme class application is already handled in ThemeContext.jsx
  // We don't need to apply it here again

  const handleToggle = () => {
    toggleDarkMode();
  }

  // Get the appropriate icon and tooltip based on theme mode
  const getThemeIcon = () => {
    if (themeMode === 'system') {
      return {
        icon: <Monitor size={20} className="text-yellow-400" />,
        tooltip: `System theme (currently ${darkMode ? 'dark' : 'light'})`
      };
    } else if (darkMode) {
      return {
        icon: <Sun size={20} className="text-yellow-400" />,
        tooltip: 'Switch to light mode'
      };
    } else {
      return {
        icon: <Moon size={20} className="text-yellow-400" />,
        tooltip: 'Switch to dark mode'
      };
    }
  };

  const { icon, tooltip } = getThemeIcon();

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-950 dark:to-blue-900 border-b border-blue-700 dark:border-blue-800 sticky top-0 z-10 shadow-md">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {title}
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {children} {/* Custom action buttons */}

          <button 
            onClick={handleToggle} 
            className="p-2 rounded-full hover:bg-blue-700/50 dark:hover:bg-blue-800/50 transition-colors"
            aria-label={tooltip}
            title={tooltip}
          >
            {icon}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg"
            >
              <span className="text-gray-900 font-bold text-sm">
                {(user?.name || ' ').charAt(0).toUpperCase()}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Menu Items */}
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Settings size={16} className="mr-3" />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <LogOut size={16} className="mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;