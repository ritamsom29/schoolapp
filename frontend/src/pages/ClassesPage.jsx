import React, { useState, useEffect } from 'react';
import { Plus, School, Layers, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ClassesPage() {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Class Form
  const [newClassName, setNewClassName] = useState('');
  const [selectedAyId, setSelectedAyId] = useState('');

  // New Section Form
  const [sectionClassName, setSectionClassName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [clsRes, ayRes] = await Promise.all([
        api.get('/classes'),
        api.get('/academic-years'),
      ]);
      setClasses(clsRes.data);
      setAcademicYears(ayRes.data);
      if (ayRes.data.length > 0 && !selectedAyId) {
        const activeYear = ayRes.data.find(y => y.is_active);
        setSelectedAyId(activeYear ? activeYear.id : ayRes.data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await api.post('/classes', {
        name: newClassName,
        academic_year_id: selectedAyId ? parseInt(selectedAyId) : null,
      });
      toast.success('Class created successfully');
      setNewClassName('');
      loadData();
    } catch (err) {
      toast.error('Failed to create class');
    }
  };

  const handleCreateSection = async (classId) => {
    if (!newSectionName) return;
    try {
      await api.post('/sections', {
        name: newSectionName.toUpperCase(),
        class_id: classId,
      });
      toast.success('Section created');
      setNewSectionName('');
      setSectionClassName('');
      loadData();
    } catch (err) {
      toast.error('Failed to create section');
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure? This will delete the class.')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Classes & Sections</h2>
        <p className="text-sm text-gray-500">Configure grade levels and sections for the academic year</p>
      </div>

      {/* Top Banner / Academic Year summary */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-700">Academic Year:</span>
          <select
            value={selectedAyId}
            onChange={(e) => setSelectedAyId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500"
          >
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name} {ay.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <form onSubmit={handleCreateClass} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Class 13"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          </form>
        )}
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading classes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <School className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                      title="Delete class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sections</div>
                  <div className="flex flex-wrap gap-2">
                    {cls.sections && cls.sections.length > 0 ? (
                      cls.sections.map((sec) => (
                        <span
                          key={sec.id}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium border border-gray-200"
                        >
                          Section {sec.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs italic">No sections configured</span>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  {sectionClassName === cls.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Section name (e.g. D)"
                        maxLength={5}
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-sm border rounded-lg uppercase"
                      />
                      <button
                        onClick={() => handleCreateSection(cls.id)}
                        className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setSectionClassName(''); setNewSectionName(''); }}
                        className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSectionClassName(cls.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Section
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
