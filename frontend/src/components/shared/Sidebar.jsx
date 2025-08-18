import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Calendar, Building, Users, Settings, LogOut, PanelLeftClose, PanelRightClose, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, logout } = useAuth();

  const userNavLinks = [
    { icon: <Home size={20} />, text: 'Home', path: '/dashboard' },
    { icon: <ClipboardList size={20} />, text: 'My Bookings', path: '/my-bookings' },
    { icon: <Settings size={20} />, text: 'Settings', path: '/settings' },
  ];

  const adminNavLinks = [
    { icon: <Home size={20} />, text: 'Home', path: '/admin' },
    { icon: <ClipboardCheck size={20} />, text: 'Booking Requests', path: '/admin/requests' },
    { icon: <Calendar size={20} />, text: 'All Bookings', path: '/admin/bookings' },
    { icon: <Building size={20} />, text: 'Venue Management', path: '/admin/venues' },
    { icon: <Users size={20} />, text: 'User Management', path: '/admin/users' },
    { icon: <Settings size={20} />, text: 'Settings', path: '/admin/settings' },
  ];

  const navLinks = user?.role === 'admin' ? adminNavLinks : userNavLinks;

  const NavLink = ({ icon, text, path }) => (
    <Link
      to={path}
      className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
        location.pathname === path
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      } ${!isExpanded && 'justify-center'}`}
      title={text} // Tooltip for collapsed view
    >
      {icon}
      {isExpanded && <span className="ml-4 font-medium whitespace-nowrap">{text}</span>}
    </Link>
  );

  return (
    <aside
      className={`relative h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out flex flex-col ${isExpanded ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`flex items-center border-b border-slate-200 dark:border-slate-700 h-16 ${isExpanded ? 'justify-between px-4' : 'justify-center'}`}>
        {isExpanded && <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">BookSpace</h1>}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map((link) => <NavLink key={link.text} {...link} />)}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <Link
          to="/login"
          onClick={logout}
          className={`flex items-center p-3 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 ${!isExpanded && 'justify-center'}`}
          title="Logout"
        >
          <LogOut size={20} />
          {isExpanded && <span className="ml-4 font-medium whitespace-nowrap">Logout</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;