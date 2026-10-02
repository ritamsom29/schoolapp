import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, User, Pencil } from 'lucide-react';
import studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext'; // assuming

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await studentService.getStudent(id);
        setStudent(res?.data || res);
      } catch (err) {
        setError('Student not found');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) {
    return <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !student) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">404 - Not Found</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => navigate('/students')} className="text-indigo-600 hover:underline">Back to Students</button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm text-gray-500 items-center">
        <Link to="/students" className="hover:text-gray-900 transition-colors flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Students
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 font-medium">{student.name}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 relative border border-gray-100 flex items-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mr-6">
          <User className="w-10 h-10 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{student.name}</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-200">
              ID: {student.student_id}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-200">
              Admin No: {student.admission_number}
            </span>
            <span className={`px-3 py-1 text-xs rounded-full font-semibold border ${
              student.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
              student.status === 'inactive' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}>
              {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Unknown'}
            </span>
          </div>
        </div>
        {isAdmin && (
          <Link
            to={`/students/${student.id}/edit`}
            className="absolute top-6 right-6 inline-flex items-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Edit Student"
          >
            <Pencil className="w-5 h-5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Personal Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Personal Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Date of Birth:</span> <span className="font-medium">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gender:</span> <span className="font-medium">{student.gender || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Roll Number:</span> <span className="font-medium">{student.roll_number || '-'}</span></div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Academic Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Class:</span> <span className="font-medium">{student.class_name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Section:</span> <span className="font-medium">{student.section_name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Admission Date:</span> <span className="font-medium">{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span></div>
          </div>
        </div>

        {/* Parent Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Parent Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Father's Name:</span> <span className="font-medium">{student.father_name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Mother's Name:</span> <span className="font-medium">{student.mother_name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Guardian Name:</span> <span className="font-medium">{student.guardian_name || '-'}</span></div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Contact Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Parent Phone:</span> <span className="font-medium">{student.parent_phone || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Parent Email:</span> <span className="font-medium">{student.parent_email || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Emergency Contact:</span> <span className="font-medium">{student.emergency_contact || '-'}</span></div>
            <div className="flex flex-col"><span className="text-gray-500 mb-1">Address:</span> <span className="font-medium">{student.address || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Attendance Summary Placeholder */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Attendance Summary</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-md flex-1 text-center border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Working Days</p>
            <p className="text-2xl font-bold text-gray-800">--</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md flex-1 text-center border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Present</p>
            <p className="text-2xl font-bold text-green-600">--</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md flex-1 text-center border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Absent</p>
            <p className="text-2xl font-bold text-red-600">--</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md flex-1 text-center border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Leave</p>
            <p className="text-2xl font-bold text-yellow-600">--</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md flex-1 text-center border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Late</p>
            <p className="text-2xl font-bold text-orange-600">--</p>
          </div>
        </div>
        
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-gray-700">Overall Attendance</span>
          <span className="font-bold text-indigo-600">--%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
        </div>
        
        <p className="text-sm text-gray-500 text-center italic mt-4">Attendance data will be available after Phase 5</p>
      </div>

    </div>
  );
};

export default StudentDetailPage;
