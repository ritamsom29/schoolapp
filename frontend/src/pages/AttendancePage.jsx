import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Save, CheckCheck, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import classService from '../services/classService';
import studentService from '../services/studentService';
import attendanceService from '../services/attendanceService';
import { useAuth } from '../context/AuthContext';

export default function AttendancePage() {
  const { user, isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRecords, setExistingRecords] = useState(null);

  // Load classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        const clsList = await classService.getClasses();
        setClasses(clsList);
        if (clsList.length > 0) {
          setSelectedClassId(clsList[0].id);
        }
      } catch (err) {
        toast.error('Failed to load classes');
      }
    }
    fetchClasses();
  }, []);

  // Update sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => String(c.id) === String(selectedClassId));
      const secs = cls?.sections || [];
      setSections(secs);
      if (secs.length > 0) {
        setSelectedSectionId(secs[0].id);
      } else {
        setSelectedSectionId('');
      }
    } else {
      setSections([]);
      setSelectedSectionId('');
    }
  }, [selectedClassId, classes]);

  // Load students & check if attendance already recorded for class, section & date
  useEffect(() => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) {
      setStudents([]);
      return;
    }

    async function loadStudentsAndAttendance() {
      try {
        setLoading(true);
        // 1. Get students for class & section
        const stuData = await studentService.getStudents({
          class_id: selectedClassId,
          section_id: selectedSectionId,
          page_size: 100,
          status: 'active',
        });
        const stuList = stuData.students || [];
        setStudents(stuList);

        // 2. Check existing attendance
        const attRecords = await attendanceService.getAttendance({
          class_id: selectedClassId,
          section_id: selectedSectionId,
          date: selectedDate,
        });

        if (attRecords && attRecords.length > 0) {
          setExistingRecords(attRecords);
          const map = {};
          attRecords.forEach(r => {
            map[r.student_id] = r.status;
          });
          setAttendanceMap(map);
        } else {
          setExistingRecords(null);
          // Default all to PRESENT
          const map = {};
          stuList.forEach(s => {
            map[s.id] = 'PRESENT';
          });
          setAttendanceMap(map);
        }
      } catch (err) {
        toast.error('Failed to load students or attendance records');
      } finally {
        setLoading(false);
      }
    }

    loadStudentsAndAttendance();
  }, [selectedClassId, selectedSectionId, selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit attendance for this class and date?')) {
      return;
    }

    setSubmitting(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendanceMap[s.id] || 'PRESENT',
      }));

      await attendanceService.submitAttendance({
        class_id: parseInt(selectedClassId),
        section_id: parseInt(selectedSectionId),
        date: selectedDate,
        records,
      });

      toast.success('Attendance submitted successfully.');
      // Refresh
      const attRecords = await attendanceService.getAttendance({
        class_id: selectedClassId,
        section_id: selectedSectionId,
        date: selectedDate,
      });
      setExistingRecords(attRecords);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRecord = async (recordId, newStatus) => {
    try {
      await attendanceService.updateAttendance(recordId, { status: newStatus });
      toast.success('Attendance corrected');
      // Update local state
      setExistingRecords(prev =>
        prev.map(r => (r.id === recordId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update record');
    }
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'ABSENT').length;
  const leaveCount = Object.values(attendanceMap).filter(s => s === 'LEAVE').length;
  const lateCount = Object.values(attendanceMap).filter(s => s === 'LATE').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Register</h2>
          <p className="text-sm text-gray-500">Record and review daily class attendance</p>
        </div>
      </div>

      {/* Filter / Selector Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Section</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>Section {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Date</label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Attendance Status Banner */}
      {existingRecords && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <span className="font-semibold">Attendance has already been recorded for this class.</span>
              {isAdmin && <span className="text-xs ml-2 text-amber-700">(You can correct records below as Admin)</span>}
            </div>
          </div>
          <span className="text-xs font-bold uppercase bg-amber-200 px-2.5 py-1 rounded-full">
            Recorded
          </span>
        </div>
      )}

      {/* Quick Action Counters */}
      {students.length > 0 && !existingRecords && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Quick Actions:</span>
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 transition"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition"
            >
              Mark All Absent
            </button>
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-green-600">Present: {presentCount}</span>
            <span className="text-red-600">Absent: {absentCount}</span>
            <span className="text-blue-600">Leave: {leaveCount}</span>
            <span className="text-amber-600">Late: {lateCount}</span>
            <span className="text-gray-400">Total: {students.length}</span>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No active students in this class and section.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Roll</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  {existingRecords && isAdmin && <th className="px-6 py-4 text-right">Correct Status</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => {
                  const currentStatus = attendanceMap[student.id] || 'PRESENT';
                  const rec = existingRecords?.find(r => r.student_id === student.id);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">{student.roll_number || '—'}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">{student.student_id}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{student.name}</td>
                      
                      {/* Interactive Buttons when taking attendance */}
                      {!existingRecords ? (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {['PRESENT', 'ABSENT', 'LEAVE', 'LATE'].map((st) => {
                              const active = currentStatus === st;
                              let btnClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition ';
                              if (st === 'PRESENT') {
                                btnClass += active ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-green-50';
                              } else if (st === 'ABSENT') {
                                btnClass += active ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-red-50';
                              } else if (st === 'LEAVE') {
                                btnClass += active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-blue-50';
                              } else if (st === 'LATE') {
                                btnClass += active ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-amber-50';
                              }
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, st)}
                                  className={btnClass}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ) : (
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                            rec?.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                            rec?.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                            rec?.status === 'LEAVE' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {rec?.status}
                          </span>
                        </td>
                      )}

                      {/* Admin correction option */}
                      {existingRecords && isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <select
                            value={rec?.status || 'PRESENT'}
                            onChange={(e) => handleUpdateRecord(rec.id, e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 bg-white font-medium focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="PRESENT">PRESENT</option>
                            <option value="ABSENT">ABSENT</option>
                            <option value="LEAVE">LEAVE</option>
                            <option value="LATE">LATE</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {students.length > 0 && !existingRecords && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}
