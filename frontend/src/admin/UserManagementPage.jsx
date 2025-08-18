import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PageHeader, ConfirmationModal } from '../components/shared';
import { Check, X, Trash2, Search, Filter, User as UserIcon } from 'lucide-react';
import { Spinner } from '../components/ui';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/users?page=${currentPage}&limit=10&search=${search}&status=${status}`);
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, status]);

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      if (actionType === 'approve') {
        await axios.put(`/users/${selectedUser._id}/approve`);
      } else if (actionType === 'reject') {
        await axios.put(`/users/${selectedUser._id}/reject`);
      } else if (actionType === 'remove') {
        await axios.delete(`/users/${selectedUser._id}`);
      }
      fetchUsers();
    } catch (err) {
      console.error(`Error ${actionType}ing user:`, err);
    }
    setShowConfirmation(false);
    setSelectedUser(null);
    setActionType('');
  };

  const openConfirmation = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowConfirmation(true);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="User Management" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="relative w-full md:w-auto">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full md:w-auto pl-10 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500">Error: {error}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <div key={user._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Role: {user.role}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[user.status]}`}>
                          {user.status}
                        </span>
                        <div className="flex items-center space-x-2">
                          {user.status === 'pending' && (
                            <>
                              <button onClick={() => openConfirmation(user, 'approve')} className="p-2 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                                <Check size={20} />
                              </button>
                              <button onClick={() => openConfirmation(user, 'reject')} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                <X size={20} />
                              </button>
                            </>
                          )}
                          <button onClick={() => openConfirmation(user, 'remove')} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
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
