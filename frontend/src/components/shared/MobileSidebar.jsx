import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { Home, ClipboardCheck, Calendar, Building, Users, Settings, LogOut } from 'lucide-react';

// Helper for conditional class names (similar to clsx)
const cn = (...classes) => classes.filter(Boolean).join(' ');

const MobileSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const sidebarSections = [
    {
      title: "Main",
      items: [
        { id: "dashboard", title: "Dashboard", icon: Home, href: user?.role === 'admin' ? "/admin" : "/dashboard", end: true },
        { id: "my-bookings", title: "My Bookings", icon: ClipboardCheck, href: "/my-bookings", roles: ['user'] },
        { id: "booking-requests", title: "Booking Requests", icon: ClipboardCheck, href: "/admin/requests", roles: ['admin'] },
        { id: "all-bookings", title: "All Bookings", icon: Calendar, href: "/admin/bookings", roles: ['admin'] },
        { id: "venue-management", title: "Venue Management", icon: Building, href: "/admin/venues", roles: ['admin'] },
        { id: "user-management", title: "User Management", icon: Users, href: "/admin/users", roles: ['admin'] },
      ]
    },
    {
      title: "System",
      items: [
        { id: "settings", title: "Settings", icon: Settings, href: user?.role === 'admin' ? "/admin/settings" : "/settings" },
      ]
    }
  ];

  const filteredSidebarSections = sidebarSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.roles) {
        return item.roles.includes(user?.role);
      }
      return true; // If no roles specified, it's for all users
    })
  })).filter(section => section.items.length > 0); // Remove empty sections

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? '0%' : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-[#1a1a1a] z-50 flex flex-col md:hidden shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img 
                src="/cropped-NEW-PCCE-LOGO.png" 
                alt="PCCE Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">PCCE BookSpace</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">Venue Booking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {filteredSidebarSections.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="px-4 mb-2">
                <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-1 px-3">
                {section.items.map((item) => (
                  <RouterNavLink
                    key={item.id}
                    to={item.href}
                    end={item.end} // Pass the end prop here
                    onClick={onClose} // Close sidebar on navigation
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-lg transition-all group relative",
                        "gap-3 px-3 py-2.5",
                        "hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:shadow-md",
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      )
                    }
                  >
                    <item.icon className="flex-shrink-0 w-5 h-5" />
                    <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                      {item.title}
                    </span>
                  </RouterNavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-[#1a1a1a] p-4">
          <RouterNavLink
            to="/login"
            onClick={async (e) => { 
              e.preventDefault();
              await logout(); 
              onClose(); 
              window.location.href = '/login';
            }}
            className={cn(
              "flex items-center rounded-lg transition-all",
              "bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
              "border border-slate-200 dark:border-[#2a2a2a]",
              "w-full gap-3 px-3 py-2.5"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
              Logout
            </span>
          </RouterNavLink>
        </div>
      </motion.div>
    </>
  );
};

export default MobileSidebar;
