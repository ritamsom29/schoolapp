import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { teacherService } from '../services/teacherService';
import { classService } from '../services/classService';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
  });

  // ============================================================
  // LOAD TEACHERS AND CLASSES
  // ============================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const params =
        statusFilter !== 'all'
          ? { status_filter: statusFilter }
          : {};

      const [teachersResponse, classesResponse] =
        await Promise.all([
          teacherService.getTeachers(params),
          classService.getClasses(),
        ]);

      setTeachers(
        Array.isArray(teachersResponse)
          ? teachersResponse
          : []
      );

      setClasses(
        Array.isArray(classesResponse)
          ? classesResponse
          : []
      );
    } catch (error) {
      console.error('Failed to load teachers:', error);

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load teachers';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // ============================================================
  // FORM HELPERS
  // ============================================================

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
    });

    setEditingTeacher(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);

    setFormData({
      teacher_id: teacher.teacher_id || '',
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      username: '',
      password: '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // CREATE / UPDATE TEACHER
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.teacher_id.trim()) {
      toast.error('Teacher ID is required');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Teacher name is required');
      return;
    }

    try {
      setSaving(true);

      if (editingTeacher) {
        await teacherService.updateTeacher(
          editingTeacher.id,
          {
            teacher_id: formData.teacher_id.trim(),
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          }
        );

        toast.success(
          'Teacher updated successfully'
        );
      } else {
        await teacherService.createTeacher({
          teacher_id: formData.teacher_id.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          username:
            formData.username.trim() || undefined,
          password:
            formData.password || undefined,
        });

        toast.success(
          'Teacher created successfully'
        );
      }

      setShowModal(false);
      resetForm();

      await loadData();
    } catch (error) {
      console.error(
        'Teacher save error:',
        error
      );

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save teacher';

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DEACTIVATE TEACHER
  // ============================================================

  const handleDeactivate = async (teacherId) => {
    if (
      teacherId === undefined ||
      teacherId === null ||
      teacherId === ''
    ) {
      toast.error('Invalid teacher ID');
      return;
    }

    const teacher = teachers.find(
      (item) => Number(item.id) === Number(teacherId)
    );

    if (!teacher) {
      toast.error('Teacher not found');
      return;
    }

    if (teacher.status !== 'active') {
      toast.error('This teacher is already inactive');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${teacher.name || 'this teacher'}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingId(teacherId);

      console.log(
        '========================================'
      );
      console.log(
        'DEACTIVATING TEACHER'
      );
      console.log(
        'Teacher ID:',
        teacherId
      );
      console.log(
        'Teacher:',
        teacher
      );
      console.log(
        '========================================'
      );

      const response =
        await teacherService.deactivateTeacher(
          teacherId
        );

      console.log(
        'Deactivate API response:',
        response
      );

      // Update UI immediately.
      setTeachers((previousTeachers) =>
        previousTeachers.map((item) =>
          Number(item.id) === Number(teacherId)
            ? {
                ...item,
                status: 'inactive',
              }
            : item
        )
      );

      toast.success(
        response?.message ||
          'Teacher deactivated successfully'
      );

      // Reload from backend to make sure
      // frontend and database are synchronized.
      await loadData();
    } catch (error) {
      console.error(
        '========================================'
      );
      console.error(
        'DEACTIVATE TEACHER ERROR'
      );
      console.error(
        '========================================'
      );

      console.error(
        'Error:',
        error
      );

      console.error(
        'Status:',
        error?.response?.status
      );

      console.error(
        'Response:',
        error?.response?.data
      );

      const statusCode =
        error?.response?.status;

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to deactivate teacher';

      toast.error(
        statusCode
          ? `Error ${statusCode}: ${message}`
          : message
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredTeachers = teachers.filter(
    (teacher) => {
      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        teacher.name
          ?.toLowerCase()
          .includes(searchText) ||
        teacher.teacher_id
          ?.toLowerCase()
          .includes(searchText) ||
        teacher.email
          ?.toLowerCase()
          .includes(searchText) ||
        teacher.phone
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="p-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Teachers
          </h1>

          <p className="text-gray-500 mt-1">
            Manage teachers and their accounts
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>

      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">

        <div className="flex flex-col md:flex-row gap-3">

          {/* SEARCH */}
          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search teachers..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">
              All Teachers
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

        </div>

      </div>

      {/* TEACHERS TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {loading ? (

          <div className="flex items-center justify-center py-16">

            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />

            <span className="ml-3 text-gray-500">
              Loading teachers...
            </span>

          </div>

        ) : filteredTeachers.length === 0 ? (

          <div className="text-center py-16">

            <UserX className="w-12 h-12 mx-auto text-gray-300 mb-3" />

            <p className="text-gray-500">
              No teachers found
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50 border-b border-gray-200">

                <tr>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Teacher
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Teacher ID
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Contact
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Assignments
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>

                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredTeachers.map(
                  (teacher) => (

                    <tr
                      key={teacher.id}
                      className="hover:bg-gray-50 transition"
                    >

                      {/* TEACHER */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">

                            <span className="text-blue-700 font-semibold">
                              {teacher.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                'T'}
                            </span>

                          </div>

                          <div>

                            <p className="font-medium text-gray-900">
                              {teacher.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              {teacher.email ||
                                'No email'}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* TEACHER ID */}
                      <td className="px-6 py-4">

                        <span className="text-sm font-medium text-gray-700">
                          {teacher.teacher_id}
                        </span>

                      </td>

                      {/* CONTACT */}
                      <td className="px-6 py-4">

                        <span className="text-sm text-gray-600">
                          {teacher.phone || '—'}
                        </span>

                      </td>

                      {/* ASSIGNMENTS */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2">

                          <UserCheck className="w-4 h-4 text-gray-400" />

                          <span className="text-sm text-gray-700">
                            {teacher.assignments?.length ||
                              0}
                          </span>

                        </div>

                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                            teacher.status ===
                            'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {teacher.status ===
                          'active'
                            ? 'Active'
                            : 'Inactive'}
                        </span>

                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">

                        <div className="flex items-center justify-end gap-2">

                          {/* EDIT */}
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                teacher
                              )
                            }
                            className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition"
                            title="Edit Teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* DEACTIVATE */}
                          {teacher.status ===
                            'active' && (

                            <button
                              type="button"
                              onClick={() =>
                                handleDeactivate(
                                  teacher.id
                                )
                              }
                              disabled={
                                deactivatingId ===
                                teacher.id
                              }
                              className={`p-1.5 rounded-lg transition ${
                                deactivatingId ===
                                teacher.id
                                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                              }`}
                              title="Deactivate Teacher"
                            >

                              {deactivatingId ===
                              teacher.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}

                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTeacher
                    ? 'Edit Teacher'
                    : 'Add Teacher'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingTeacher
                    ? 'Update teacher information'
                    : 'Create a new teacher account'}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >

              {/* TEACHER ID */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher ID
                </label>

                <input
                  type="text"
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleChange}
                  disabled={!!editingTeacher}
                  placeholder="e.g. T001"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

              </div>

              {/* NAME */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Teacher name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* EMAIL */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="teacher@school.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* PHONE */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* NEW TEACHER LOGIN DETAILS */}
              {!editingTeacher && (
                <>
                  {/* USERNAME */}
                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>

                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                  {/* PASSWORD */}
                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Optional - default: teacher123"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>
                </>
              )}

              {/* FOOTER BUTTONS */}
              <div className="flex justify-end gap-3 pt-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >

                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />

                      {editingTeacher
                        ? 'Update Teacher'
                        : 'Create Teacher'}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default TeachersPage;