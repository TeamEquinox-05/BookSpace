import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { PageHeader } from '../components/shared';
import FormSkeleton from '../components/ui/FormSkeleton';
import { Spinner } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { themeMode, setTheme } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Settings" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : !user ? (
              <div>No user data found.</div>
            ) : (
              <>
                {/* Theme Settings Section */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Appearance</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme Preference
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Choose how BookSpace looks to you. Select a single theme, or sync with your system preferences.
                      </p>
                      
                      {/* Theme Options */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Light Theme */}
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            themeMode === 'light'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <Sun size={32} className={`mb-2 ${themeMode === 'light' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`} />
                          <span className={`font-medium ${themeMode === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            Light
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Always light theme
                          </span>
                        </button>

                        {/* Dark Theme */}
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            themeMode === 'dark'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <Moon size={32} className={`mb-2 ${themeMode === 'dark' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`} />
                          <span className={`font-medium ${themeMode === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            Dark
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Always dark theme
                          </span>
                        </button>

                        {/* System Theme */}
                        <button
                          onClick={() => setTheme('system')}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            themeMode === 'system'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <Monitor size={32} className={`mb-2 ${themeMode === 'system' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`} />
                          <span className={`font-medium ${themeMode === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            System
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Sync with system
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input type="text" defaultValue={user.name} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <input type="email" value={user.email} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      <input type="text" defaultValue={user.phone} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                      <input type="text" value={user.role} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm dark:text-white" />
                    </div>
                  </div>
                  <div className="mt-6 text-right">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Update Profile</button>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                      <input type="password" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                      <input type="password" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white" />
                    </div>
                  </div>
                  <div className="mt-6 text-right">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Change Password</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
