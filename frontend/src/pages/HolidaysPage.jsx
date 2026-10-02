import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, X, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HolidaysPage() {
  const { isAdmin } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
  });

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.get('/holidays');
      setHolidays(res.data);
    } catch (err) {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.date) {
      toast.error('Name and date are required');
      return;
    }

    try {
      await api.post('/holidays', formData);
      toast.success('Holiday added');
      setShowAddModal(false);
      setFormData({ name: '', date: '', description: '' });
      loadHolidays();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      toast.success('Holiday deleted');
      loadHolidays();
    } catch (err) {
      toast.error('Failed to delete holiday');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">School Calendar & Holidays</h2>
          <p className="text-sm text-gray-500">
            Holidays are automatically excluded when calculating monthly working days
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Holiday
          </button>
        )}
      </div>

      {/* Holidays Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading holidays...</div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No holidays declared yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Holiday Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
                        <PartyPopper className="w-4 h-4" />
                      </div>
                      {h.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-600 font-mono">
                      {h.date}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{h.description || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition"
                          title="Delete holiday"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add School Holiday</h3>
            <form onSubmit={handleCreateHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                <textarea
                  placeholder="Optional notes or details"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
