import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import dashboardService from '../services/dashboardService';

export default function TeacherDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await dashboardService.getTeacherStats();
        setData(res);
      } catch (err) {
        toast.error('Failed to load teacher dashboard info');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your teaching dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">No dashboard information available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">Teacher Portal</span>
          <h2 className="text-2xl font-bold mt-1">Good Morning, {data.teacher_name}!</h2>
          <p className="text-indigo-100 text-sm mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> {data.today_date}
          </p>
        </div>

        <Link
          to="/attendance"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow hover:bg-indigo-50 transition"
        >
          <ClipboardCheck className="w-5 h-5" />
          Take Attendance
        </Link>
      </div>

      {/* Assigned Classes Card List */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Your Assigned Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.assigned_classes.map((cls, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xl font-bold text-gray-900">
                    {cls.class_name} - Section {cls.section_name}
                  </h4>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    cls.attendance_completed_today 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {cls.attendance_completed_today ? 'Completed' : 'Pending'}
                  </span>
                </div>

                <div className="text-sm text-gray-500">
                  Total Enrolled: <strong className="text-gray-900">{cls.total_students}</strong> students
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Today's Record</span>
                <Link
                  to="/attendance"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {cls.attendance_completed_today ? 'View Register' : 'Mark Attendance'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
