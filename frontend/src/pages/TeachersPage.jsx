import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, X, Check, School, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import teacherService from '../services/teacherService';
import classService from '../services/classService';
import { useAuth } from '../context/AuthContext';

export default function TeachersPage() {
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // New Teacher Form
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    email: '',
    phone: '',
    password: 'teacher123',
  });

  // Assign Form
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');
  const [availableSections, setAvailableSections] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, cData] = await Promise.all([
        teacherService.getTeachers(),
        classService.getClasses(),
      ]);
      setTeachers(tData);
      setClasses(cData);
    } catch (err) {
      toast.error('Failed to load teachers or classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (assignClassId) {
      const cls = classes.find(c => String(c.id) === String(assignClassId));
      setAvailableSections(cls?.sections || []);
      setAssignSectionId(cls?.sections?.[0]?.id || '');
    } else {
      setAvailableSections([]);
      setAssignSectionId('');
    }
  }, [assignClassId, classes]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.name) {
      toast.error('Teacher ID and Name are required');
      return;
    }
    try {
      await teacherService.createTeacher(formData);
      toast.success('Teacher added successfully!');
      setShowAddModal(false);
      setFormData({ teacher_id: '', name: '', email: '', phone: '', password: 'teacher123' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add teacher');
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !assignClassId || !assignSectionId) {
      toast.error('Please select both class and section');
      return;
    }
    try {
      await teacherService.assignTeacher({
        teacher_id: selectedTeacher.id,
        class_id: parseInt(assignClassId),
        section_id: parseInt(assignSectionId),
      });
      toast.success('Teacher assigned successfully!');
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign class');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await teacherService.removeAssignment(assignmentId);
      toast.success('Assignment removed');
      loadData();
    } catch (err) {
      toast.error('Failed to remove assignment');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this teacher?')) return;
    try {
      await teacherService.deactivateTeacher(id);
      toast.success('Teacher deactivated');
      loadData();
    } catch (err) {
      toast.error('Failed to deactivate teacher');
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.teacher_id.toLowerCase().includes(search.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
          <p className="text-sm text-gray-500">Manage teaching faculty and class assignments</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Teacher
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search teacher by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Teachers List / Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading teachers...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No teachers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Assigned Classes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{teacher.teacher_id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{teacher.name}</td>
                    <td className="px-6 py-4">
                      <div>{teacher.email || '—'}</div>
                      <div className="text-xs text-gray-400">{teacher.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {teacher.assignments && teacher.assignments.length > 0 ? (
                          teacher.assignments.map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium border border-indigo-100"
                            >
                              {a.class_name}-{a.section_name}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAssignment(a.id)}
                                  className="text-indigo-400 hover:text-red-500 ml-0.5"
                                >
                                  &times;
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">No class assigned</span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowAssignModal(true);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-1"
                          >
                            + Assign
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && teacher.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(teacher.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Deactivate Teacher"
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

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Teacher</h3>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Teacher ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCH006"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Nambiar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
                <input
                  type="email"
                  placeholder="e.g. meera@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  Add Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Class Modal */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Assign Class to Teacher</h3>
            <p className="text-sm text-gray-500 mb-4">
              Assigning classes to <strong className="text-gray-900">{selectedTeacher.name}</strong> ({selectedTeacher.teacher_id})
            </p>
            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Class *</label>
                <select
                  required
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Section *</label>
                <select
                  required
                  value={assignSectionId}
                  onChange={(e) => setAssignSectionId(e.target.value)}
                  disabled={!assignClassId}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">Select Section</option>
                  {availableSections.map((s) => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Assign Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
