import React, { useState } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Calendar, Building, Users, Settings, LogOut, Search, ChevronRight, Plus, FileText, Bell, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

// Helper for conditional class names (similar to clsx)
const cn = (...classes) => classes.filter(Boolean).join(' ');

const Sidebar = ({ isExpanded, setIsExpanded, onMouseEnter, onMouseLeave }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Define sidebar sections and items
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

  // Filter nav links based on user role
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
    <motion.div
      className={cn(
        "fixed left-0 top-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out z-50",
        "shadow-lg overflow-hidden", // Added overflow-hidden to prevent scrollbars
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 min-w-0"> {/* Added min-w-0 to prevent overflow */}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          {isExpanded && (
            <div className="overflow-hidden min-w-0"> {/* Added min-w-0 for proper text truncation */}
              <h1 className="text-slate-900 dark:text-white font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">
                BookSpace
              </h1>
            </div>
          )}
        </div>
      </div>

      

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
        {filteredSidebarSections.map((section) => (
          <div key={section.title} className="mb-6">
            {/* Section Header */}
            {isExpanded && (
              <div className="px-4 mb-2">
                <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>
            )}

            {/* Section Items */}
            <div className={cn("space-y-1", isExpanded ? "px-3" : "px-2")}>
              {section.items.map((item) => (
                <RouterNavLink
                  key={item.id}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-lg transition-all group relative",
                      isExpanded 
                        ? "gap-3 px-3 py-2.5" 
                        : "justify-center px-2 py-2.5 w-12 h-12 mx-auto",
                      "hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:shadow-md",
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    )
                  }
                >
                  <item.icon className={cn("flex-shrink-0", isExpanded ? "w-5 h-5" : "w-5 h-5")} />
                  
                  {isExpanded && (
                    <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                      {item.title}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 delay-300">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</div>
                    </div>
                  )}
                </RouterNavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 overflow-hidden">
        <RouterNavLink
          to="/login"
          onClick={logout}
          className={({ isActive }) =>
            cn(
              "flex items-center rounded-lg transition-all",
              "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
              "border border-slate-200 dark:border-slate-600",
              isExpanded 
                ? "w-full gap-3 px-3 py-2.5" 
                : "justify-center w-12 h-12 mx-auto px-2 py-2.5"
            )
          }
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
              Logout
            </span>
          )}
        </RouterNavLink>
      </div>
    </motion.div>
  );
};

export default Sidebar;
