import React, { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, School, CheckCircle, XCircle, 
  TrendingUp, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import dashboardService from '../services/dashboardService';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await dashboardService.getAdminStats();
        setData(res);
      } catch (err) {
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard analytics...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">No dashboard data available.</div>;
  }

  const { top_stats, attendance_trends, class_wise_attendance, low_attendance_students } = data;

  const statCards = [
    { label: 'Total Students', value: top_stats.total_students, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Teachers', value: top_stats.total_teachers, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Classes', value: top_stats.total_classes, icon: School, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Present Today', value: top_stats.present_today, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Absent Today', value: top_stats.absent_today, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Average Attendance', value: `${top_stats.average_attendance}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Low Attendance', value: top_stats.low_attendance_count, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Real-time attendance analysis and school statistics</p>
      </div>

      {/* Top 7 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">{c.label}</span>
              <div className={`p-1.5 rounded-lg ${c.bg}`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Recharts Data Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Attendance Trend */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1">Attendance Trend (Past 7 Days)</h3>
          <p className="text-xs text-gray-500 mb-4">Overall student presence vs absence rate</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendance_trends}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="present" name="Present" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" fill="#fee2e2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Class-wise Attendance Comparison */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1">Class-wise Attendance %</h3>
          <p className="text-xs text-gray-500 mb-4">Percentage breakdown across grade levels</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={class_wise_attendance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="class_name" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="percentage" name="Attendance %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Attendance Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-gray-900">Low Attendance Students (&lt; 75%)</h3>
          </div>
          <Link to="/students" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View all students <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {low_attendance_students.length === 0 ? (
          <div className="p-6 text-center text-sm text-green-600 bg-green-50 rounded-lg">
            No students currently below the minimum attendance threshold!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Attendance %</th>
                  <th className="px-4 py-3">Threshold</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {low_attendance_students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{s.student_id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                    <td className="px-4 py-3">{s.class_name} - {s.section_name}</td>
                    <td className="px-4 py-3 font-bold text-red-600">{s.percentage}%</td>
                    <td className="px-4 py-3 text-gray-400">{s.threshold}%</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 uppercase">
                        Low Attendance
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
