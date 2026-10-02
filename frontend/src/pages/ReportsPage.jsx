import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Table, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import classService from '../services/classService';
import api from '../services/api';

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function ReportsPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find((c) => String(c.id) === String(selectedClassId));
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

  const handleGenerateReport = async () => {
    if (!selectedClassId || !selectedSectionId) {
      toast.error('Please select a class and section');
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/reports/monthly', {
        params: {
          year: selectedYear,
          month: selectedMonth,
          class_id: selectedClassId,
          section_id: selectedSectionId,
        },
      });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to generate attendance report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedClassId || !selectedSectionId) return;
    const token = localStorage.getItem('token');
    window.open(
      `/api/reports/monthly/pdf?year=${selectedYear}&month=${selectedMonth}&class_id=${selectedClassId}&section_id=${selectedSectionId}&token=${token}`,
      '_blank'
    );
  };

  const handleDownloadExcel = () => {
    if (!selectedClassId || !selectedSectionId) return;
    const token = localStorage.getItem('token');
    window.open(
      `/api/reports/monthly/excel?year=${selectedYear}&month=${selectedMonth}&class_id=${selectedClassId}&section_id=${selectedSectionId}&token=${token}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
        <p className="text-sm text-gray-500">
          Generate comprehensive monthly reports, calculate percentages, and export to official PDF/Excel
        </p>
      </div>

      {/* Control Filter Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Academic Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Section</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>Section {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Filter className="w-4 h-4" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Generated Report View */}
      {reportData && (
        <div className="space-y-6">
          {/* Header Summary & Export Buttons */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {reportData.month_name} {reportData.year} — {reportData.class_name} Section {reportData.section_name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Total Working Days: <strong>{reportData.total_working_days}</strong> | Class Average:{' '}
                <strong className="text-indigo-600">{reportData.average_attendance}%</strong> | Low Attendance:{' '}
                <strong className="text-red-600">{reportData.low_attendance_count}</strong> students
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handleDownloadExcel}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5">Roll</th>
                    <th className="px-4 py-3.5">Student ID</th>
                    <th className="px-4 py-3.5">Admission No</th>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5 text-center">Working Days</th>
                    <th className="px-4 py-3.5 text-center text-green-700">Present</th>
                    <th className="px-4 py-3.5 text-center text-red-700">Absent</th>
                    <th className="px-4 py-3.5 text-center text-blue-700">Leave</th>
                    <th className="px-4 py-3.5 text-center text-amber-700">Late</th>
                    <th className="px-4 py-3.5 text-center font-bold">Attendance %</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.students.map((s) => (
                    <tr key={s.student_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3.5 font-bold text-gray-900">{s.roll_number || '—'}</td>
                      <td className="px-4 py-3.5 font-mono text-gray-500">{s.student_code}</td>
                      <td className="px-4 py-3.5 font-mono text-gray-500">{s.admission_number}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">{s.student_name}</td>
                      <td className="px-4 py-3.5 text-center">{s.working_days}</td>
                      <td className="px-4 py-3.5 text-center font-medium text-green-700">{s.present}</td>
                      <td className="px-4 py-3.5 text-center font-medium text-red-700">{s.absent}</td>
                      <td className="px-4 py-3.5 text-center font-medium text-blue-700">{s.leave}</td>
                      <td className="px-4 py-3.5 text-center font-medium text-amber-700">{s.late}</td>
                      <td className="px-4 py-3.5 text-center font-bold">
                        <span className={s.is_low_attendance ? 'text-red-600' : 'text-gray-900'}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {s.is_low_attendance ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            Low
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
