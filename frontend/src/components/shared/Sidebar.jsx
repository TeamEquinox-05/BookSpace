import React from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Home, ClipboardCheck, Calendar, Building, Users, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Helper for conditional class names (similar to clsx)
const cn = (...classes) => classes.filter(Boolean).join(' ');

const Sidebar = ({ isExpanded, setIsExpanded: _setIsExpanded, onMouseEnter, onMouseLeave }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Define sidebar sections and items
  const sidebarSections = [
    {
      title: "Main",
      items: [
        { id: "dashboard", title: "Dashboard", icon: Home, href: ['admin', 'superadmin'].includes(user?.role) ? "/admin" : "/dashboard", end: true },
        { id: "my-bookings", title: "My Bookings", icon: ClipboardCheck, href: "/my-bookings", roles: ['user'] },
        { id: "booking-requests", title: "Booking Requests", icon: ClipboardCheck, href: "/admin/requests", roles: ['admin', 'superadmin'] },
        { id: "all-bookings", title: "All Bookings", icon: Calendar, href: "/admin/bookings", roles: ['admin', 'superadmin'] },
        { id: "venue-management", title: "Venue Management", icon: Building, href: "/admin/venues", roles: ['admin', 'superadmin'] },
        { id: "user-management", title: "User Management", icon: Users, href: "/admin/users", roles: ['admin', 'superadmin'] },
      ]
    },
    {
      title: "System",
      items: [
        { id: "settings", title: "Settings", icon: Settings, href: ['admin', 'superadmin'].includes(user?.role) ? "/admin/settings" : "/settings" },
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
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-white dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-[#1a1a1a] z-50",
        "shadow-lg overflow-hidden flex flex-col transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img 
              src="/cropped-NEW-PCCE-LOGO.png" 
              alt="PCCE Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
        {filteredSidebarSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-6">
            {/* Section Header */}
            {isExpanded && (
              <div 
                className="px-4 mb-2"
              >
                  <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </h2>
              </div>
            )}

            {/* Section Items */}
            <div className={cn("space-y-1", isExpanded ? "px-3" : "px-2")}>
              {section.items.map((item, index) => (
                <RouterNavLink
                  key={item.id}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-xl transition-all duration-200 group relative",
                      isExpanded 
                        ? "gap-3 px-3 py-2.5" 
                        : "justify-center px-2 py-2.5 w-12 h-12 mx-auto",
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div>
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
                      </div>
                      
                      {isExpanded && (
                        <span 
                          className="font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0"
                        >
                            {item.title}
                        </span>
                      )}

                      {/* Active Indicator for expanded state */}
                      {isActive && isExpanded && (
                        <div className="absolute right-3">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}

                      {/* Tooltip for collapsed state */}
                      {!isExpanded && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1a1a] dark:bg-[#1a1a1a] text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 text-sm font-medium">
                          {item.title}
                          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#1a1a1a] dark:bg-[#1a1a1a] rotate-45"></div>
                        </div>
                      )}
                    </>
                  )}
                </RouterNavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile & Logout Section */}
      <div className="border-t border-slate-200 dark:border-[#1a1a1a] p-3 flex-shrink-0">
        {/* User Profile */}
        {isExpanded && (
          <div 
            className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-slate-50 dark:bg-[#1a1a1a]"
          >
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user?.role || 'user'}
                </p>
              </div>
          </div>
        )}
        {/* Collapsed User Avatar */}
        {!isExpanded && (
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group relative">
              <span className="text-white font-semibold text-sm">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1a1a] dark:bg-[#1a1a1a] text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-300 capitalize">{user?.role || 'user'}</p>
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#1a1a1a] dark:bg-[#1a1a1a] rotate-45"></div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className={cn(
            "flex items-center rounded-xl transition-all duration-200",
            "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400",
            "border border-red-200 dark:border-red-800",
            isExpanded 
              ? "w-full gap-3 px-3 py-2.5" 
              : "justify-center w-12 h-12 mx-auto px-2 py-2.5"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <span 
              className="font-medium whitespace-nowrap"
            >
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
