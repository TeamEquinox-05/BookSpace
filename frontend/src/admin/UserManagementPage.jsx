import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PageHeader, ConfirmationModal } from '../components/shared';

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

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="User Management" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-1/3 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div>Error: {error}</div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.status === 'pending' && (
                            <>
                              <button onClick={() => openConfirmation(user, 'approve')} className="text-green-600 hover:text-green-900 mr-4">Approve</button>
                              <button onClick={() => openConfirmation(user, 'reject')} className="text-red-600 hover:text-red-900">Reject</button>
                            </>
                          )}
                          <button onClick={() => openConfirmation(user, 'remove')} className="text-red-600 hover:text-red-900 ml-4">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">Next</button>
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
