import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { PageHeader, ConfirmationModal } from '../components/shared';
import { Check, X, Trash2, Search, Filter, User as UserIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Badge, EmptyState } from '../components/ui';
import logger from '../utils/logger';

const UserCard = ({ user, onApprove, onReject, onRemove }) => {
  return (
    <div
      className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* Status bar at top */}
      <div className={`h-1 ${
        user.status === 'active' ? 'bg-green-500' :
        user.status === 'pending' ? 'bg-amber-400' :
        'bg-red-500'
      }`} />
      
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="info" size="sm">
                {user.role}
              </Badge>
              <Badge variant={Badge.fromStatus(user.status)} size="sm" dot>
                {user.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1a1a1a] flex items-center justify-end gap-2">
          {user.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(user)}
                className="p-2 rounded-lg text-green-600 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                title="Approve user"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => onReject(user)}
                className="p-2 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                title="Reject user"
              >
                <X size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => onRemove(user)}
            className="p-2 rounded-lg text-slate-500 bg-slate-50 dark:bg-[#1a1a1a] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors"
            title="Remove user"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');

  // Debounce search input to avoid firing an API call on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users?page=${currentPage}&limit=10&search=${debouncedSearch}&status=${status}`);
        if (isMounted) {
          setUsers(res.data.users);
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          logger.error('Error fetching users:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => { isMounted = false; };
  }, [currentPage, debouncedSearch, status]);

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    try {
      if (actionType === 'approve') await api.put(`/users/${selectedUser._id}/approve`);
      else if (actionType === 'reject') await api.put(`/users/${selectedUser._id}/reject`);
      else if (actionType === 'remove') await api.delete(`/users/${selectedUser._id}`);

      const res = await api.get(`/users?page=${currentPage}&limit=10&search=${debouncedSearch}&status=${status}`);
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      logger.error(`Error ${actionType}ing user:`, err);
      setError(err.response?.data?.msg || `Failed to ${actionType} user. Please try again.`);
    } finally {
      setShowConfirmation(false);
      setSelectedUser(null);
      setActionType('');
    }
  };

  const openConfirmation = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowConfirmation(true);
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="User Management" subtitle="Manage user accounts and permissions" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
          <div className="max-w-7xl mx-auto">
            {/* Error banner */}
            {error && !loading && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700 font-bold text-lg leading-none">&times;</button>
              </div>
            )}
            {/* Filters */}
            <div 
              className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] p-4 mb-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full md:w-auto pl-10 pr-8 py-2.5 text-sm border border-slate-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-[#1a1a1a] p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-[#1a1a1a]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-[#1a1a1a] rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-[#1a1a1a] rounded w-1/2" />
                        <div className="flex gap-2 mt-2">
                          <div className="h-5 w-14 bg-slate-200 dark:bg-[#1a1a1a] rounded-full" />
                          <div className="h-5 w-14 bg-slate-200 dark:bg-[#1a1a1a] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={UserIcon}
                title="Error Loading Users"
                description={error}
                actionLabel="Try Again"
                onAction={() => window.location.reload()}
                size="lg"
              />
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Users Found"
                description={search || status ? "No users match your filters. Try adjusting your search." : "No users in the system yet."}
                size="lg"
              />
            ) : (
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                  {users.map((user) => (
                    <UserCard
                      key={user._id}
                      user={user}
                      onApprove={(u) => openConfirmation(u, 'approve')}
                      onReject={(u) => openConfirmation(u, 'reject')}
                      onRemove={(u) => openConfirmation(u, 'remove')}
                    />
                  ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && users.length > 0 && (
              <div 
                className="mt-8 flex justify-center"
              >
                <div className="inline-flex items-center gap-1 bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border border-slate-200 dark:border-[#1a1a1a] p-1">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border-x border-slate-200 dark:border-[#1a1a1a]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {showConfirmation && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleAction}
          title={`Confirm ${actionType}`}
          message={`Are you sure you want to ${actionType} this user?`}
        />
      )}
    </>
  );
}
