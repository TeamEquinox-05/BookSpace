import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import logger from '../utils/logger';
import { PageHeader } from '../components/shared';
import { FormSkeleton } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Shield, Lock, Sun, Moon, Monitor, Save, Eye, EyeOff, Check, Database, Download, Upload, AlertTriangle } from 'lucide-react';

const SettingsSection = ({ icon: Icon, title, description, children, delay: _delay = 0 }) => (
  <div 
    className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-slate-200 dark:border-[#1a1a1a] overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const ThemeOption = ({ icon: Icon, label, value, selected, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`relative flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
      selected 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
        : 'border-slate-200 dark:border-[#1a1a1a] hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
    }`}
  >
    {selected && (
      <div
        className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
      >
        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
      </div>
    )}
    <div 
      className={`p-3 rounded-xl transition-colors ${
        selected 
          ? 'bg-blue-500 dark:bg-blue-600' 
          : 'bg-slate-100 dark:bg-[#1a1a1a]'
      }`}
    >
      <Icon className={`w-6 h-6 transition-colors ${
        selected 
          ? 'text-white' 
          : 'text-slate-500 dark:text-slate-400'
      }`} />
    </div>
    <span className={`text-sm font-medium transition-colors ${
      selected 
        ? 'text-blue-600 dark:text-blue-400' 
        : 'text-slate-600 dark:text-slate-400'
    }`}>
      {label}
    </span>
  </button>
);

const InputField = ({ icon: Icon, label, type = 'text', value, onChange, disabled = false, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-11 ${isPassword ? 'pr-11' : 'pr-4'} py-3 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 dark:text-white placeholder-slate-400 ${
            disabled ? 'bg-slate-50 dark:bg-[#0a0a0a] cursor-not-allowed opacity-60' : ''
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { themeMode, setTheme } = useTheme();
  const { user: authUser } = useAuth();

  // DB backup/restore state
  const [dbExporting, setDbExporting] = useState(false);
  const [dbImporting, setDbImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
        setFormData(prev => ({
          ...prev,
          name: res.data.name || '',
          phone: res.data.phone || ''
        }));
      } catch (err) {
        setError(err.message);
        logger.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError(null);
    setSuccess(null);
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await api.put('/users/me', {
        name: formData.name,
        phone: formData.phone
      });
      setUser(res.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!formData.newPassword || formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.put('/users/me/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess('Password changed successfully!');
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }));
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  if (error && !user) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Settings" />
        <main className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-black">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Error Loading Settings</h3>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title="Settings" />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-black p-4 sm:p-6 transition-colors">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <FormSkeleton />
          ) : !user ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No user data found.</p>
            </div>
          ) : (
            <>
              {/* Success/Error Messages */}
              {(success || error) && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    success 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}
                >
                  {success ? (
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-medium flex-1">{success || error}</span>
                </div>
              )}

              {/* Appearance Section */}
              <SettingsSection 
                icon={Sun} 
                title="Appearance" 
                description="Choose your preferred color theme"
                delay={0}
              >
                <div className="grid grid-cols-3 gap-4">
                  <ThemeOption
                    icon={Sun}
                    label="Light"
                    value="light"
                    selected={themeMode === 'light'}
                    onChange={setTheme}
                  />
                  <ThemeOption
                    icon={Moon}
                    label="Dark"
                    value="dark"
                    selected={themeMode === 'dark'}
                    onChange={setTheme}
                  />
                  <ThemeOption
                    icon={Monitor}
                    label="System"
                    value="system"
                    selected={themeMode === 'system'}
                    onChange={setTheme}
                  />
                </div>
              </SettingsSection>

              {/* Profile Section */}
              <SettingsSection 
                icon={User} 
                title="Profile Information" 
                description="Update your personal details"
                delay={0.1}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      icon={User}
                      label="Full Name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      placeholder="Enter your name"
                    />
                    <InputField
                      icon={Mail}
                      label="Email Address"
                      type="email"
                      value={user.email}
                      disabled
                    />
                    <InputField
                      icon={Phone}
                      label="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      placeholder="Enter your phone number"
                    />
                    <InputField
                      icon={Shield}
                      label="Role"
                      value={user.role}
                      disabled
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Update Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </SettingsSection>

              {/* Password Section */}
              <SettingsSection 
                icon={Lock} 
                title="Change Password" 
                description="Update your account password"
                delay={0.2}
              >
                <div className="space-y-6">
                  <InputField
                    icon={Lock}
                    label="Current Password"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange('currentPassword')}
                    placeholder="Enter current password"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      icon={Lock}
                      label="New Password"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange('newPassword')}
                      placeholder="At least 8 characters"
                    />
                    <InputField
                      icon={Lock}
                      label="Confirm New Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Changing...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Change Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </SettingsSection>

              {/* Database Backup & Restore - Admin Only */}
              {authUser?.role === 'superadmin' && (
                <SettingsSection
                  icon={Database}
                  title="Database Backup & Restore"
                  description="Export or import the entire database"
                  delay={0.3}
                >
                  <div className="space-y-6">
                    {/* Export */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Export Database</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Download the entire database (users, venues, bookings) as a single JSON file.
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            setDbExporting(true);
                            setError(null);
                            try {
                              const res = await api.get('/db/export', { responseType: 'blob' });
                              const url = window.URL.createObjectURL(res.data);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `bookspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                              setSuccess('Database exported successfully!');
                            } catch (err) {
                              logger.error('DB export failed:', err);
                              setError(err.response?.data?.msg || 'Failed to export database');
                            } finally {
                              setDbExporting(false);
                            }
                          }}
                          disabled={dbExporting}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                        >
                          {dbExporting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Exporting...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Export Backup</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Import */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Import Database</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Restore the database from a previously exported backup file. This will <strong>replace all existing data</strong>.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setImportFile(file);
                              setImportPreview(null);
                              setError(null);

                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                try {
                                  const parsed = JSON.parse(ev.target.result);
                                  if (!parsed._meta || !parsed.data) {
                                    setError('Invalid backup file: missing _meta or data.');
                                    setImportFile(null);
                                    return;
                                  }
                                  setImportPreview(parsed._meta);
                                } catch {
                                  setError('Invalid JSON file.');
                                  setImportFile(null);
                                }
                              };
                              reader.readAsText(file);
                            }}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={dbImporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[#222] transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{importFile ? 'Change File' : 'Choose Backup File'}</span>
                          </button>
                          {importFile && (
                            <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                              {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>

                        {/* Preview */}
                        {importPreview && (
                          <div className="p-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#1a1a1a] rounded-lg">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Backup Details:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-slate-400">Exported:</span>
                                <p className="font-medium text-slate-700 dark:text-slate-300">{new Date(importPreview.exportedAt).toLocaleDateString()}</p>
                              </div>
                              {importPreview.collections && Object.entries(importPreview.collections).map(([name, count]) => (
                                <div key={name}>
                                  <span className="text-slate-400 capitalize">{name}:</span>
                                  <p className="font-medium text-slate-700 dark:text-slate-300">{count} records</p>
                                </div>
                              ))}
                              {importPreview.imageCount != null && (
                                <div>
                                  <span className="text-slate-400">Images:</span>
                                  <p className="font-medium text-slate-700 dark:text-slate-300">{importPreview.imageCount} files</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Import Button */}
                        {importFile && importPreview && !showImportConfirm && (
                          <button
                            onClick={() => setShowImportConfirm(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Import This Backup</span>
                          </button>
                        )}

                        {/* Confirmation Dialog */}
                        {showImportConfirm && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Warning: This will replace ALL data</h4>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  All current users, venues, and bookings will be permanently deleted and replaced with the backup data. This action cannot be undone.
                                </p>
                                <div className="flex items-center gap-3 mt-3">
                                  <button
                                    onClick={async () => {
                                      setDbImporting(true);
                                      setError(null);
                                      setShowImportConfirm(false);
                                      try {
                                        const text = await importFile.text();
                                        const payload = JSON.parse(text);
                                        const res = await api.post('/db/import', payload, {
                                          headers: { 'Content-Type': 'application/json' },
                                          maxBodyLength: 50 * 1024 * 1024,
                                          maxContentLength: 50 * 1024 * 1024,
                                        });
                                        setSuccess(`Database imported successfully! ${Object.entries(res.data.results || {}).map(([k, v]) => `${k}: ${v.imported}`).join(', ')}`);
                                        setImportFile(null);
                                        setImportPreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                      } catch (err) {
                                        logger.error('DB import failed:', err);
                                        setError(err.response?.data?.msg || 'Failed to import database. No data was changed.');
                                      } finally {
                                        setDbImporting(false);
                                      }
                                    }}
                                    disabled={dbImporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {dbImporting ? (
                                      <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Importing...</span>
                                      </>
                                    ) : (
                                      <span>Yes, Replace All Data</span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setShowImportConfirm(false)}
                                    disabled={dbImporting}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </SettingsSection>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}