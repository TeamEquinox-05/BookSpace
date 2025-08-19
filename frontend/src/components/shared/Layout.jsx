import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';

const Layout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { darkMode } = useTheme();

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)} />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      <motion.main
        className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Mobile Header/Hamburger */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">BookSpace</h1>
          <div></div> {/* Placeholder for right alignment */}
        </div>
        <Outlet />
      </motion.main>
    </div>
  );
};

export default Layout;
