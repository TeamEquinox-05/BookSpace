import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import { Menu } from 'lucide-react';

const Layout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)} />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}
      >
        {/* Mobile Header/Hamburger */}
        <div className="md:hidden flex items-center px-4 h-14 border-b border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a]">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors">
            <Menu size={20} />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
