import React, { useState, useEffect } from 'react';
import { Save, School, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    school_name: '',
    address: '',
    phone: '',
    email: '',
    attendance_threshold: 75.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        setFormData({
          school_name: res.data.school_name || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          attendance_threshold: res.data.attendance_threshold || 75.0,
        });
      } catch (err) {
        toast.error('Failed to load school settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only administrators can update school settings');
      return;
    }
    try {
      setSaving(true);
      await api.put('/settings', formData);
      toast.success('School settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">School Settings</h2>
        <p className="text-sm text-gray-500">
          Configure official institution details, contact information, and global attendance thresholds
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <School className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-lg">Institution Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">School Name *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Phone Number</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Official Email</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Postal Address</label>
              <textarea
                rows={3}
                disabled={!isAdmin}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 pb-2 border-t border-gray-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-lg">Attendance Threshold Policy</h3>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
              Low Attendance Warning Threshold (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                step={0.1}
                required
                disabled={!isAdmin}
                value={formData.attendance_threshold}
                onChange={(e) => setFormData({ ...formData, attendance_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
              <span className="absolute right-3 top-2 text-gray-400 font-bold">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Students whose attendance falls below this threshold will be flagged as Low Attendance on reports and dashboards.
            </p>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Account Security / Change Password */}
      <ChangePasswordSection />
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in current and new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <ShieldCheck className="w-5 h-5 text-indigo-600" />
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Change Your Password</h3>
          <p className="text-xs text-gray-500">Update your account login password</p>
        </div>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Current Password *</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Password *</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Confirm New Password *</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
            placeholder="Re-enter new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
