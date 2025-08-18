import React from 'react';
import { PageHeader } from '../components/shared';

export default function UserManagementPage() {
  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="User Management" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">User Management</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-gray-600 dark:text-gray-400">User management functionality will be implemented here.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
