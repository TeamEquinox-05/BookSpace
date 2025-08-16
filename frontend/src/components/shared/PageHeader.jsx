import React from 'react';
import { Bell, Search, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PageHeader = ({ title, children, sidebarOpen, setSidebarOpen }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const userName = localStorage.getItem('userName') || ' ';

  const handleToggle = () => {
    toggleDarkMode();
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors lg:hidden">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
            {title}
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {children} {/* Custom action buttons */}
          
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 w-40 sm:w-64 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button onClick={handleToggle} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
          
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
            <Bell size={20} className="text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full text-xs text-white flex items-center justify-center"></span>
          </button>

          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer">
            <span className="text-white font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;