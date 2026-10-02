import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import studentService from '../services/studentService';
import classService from '../services/classService';

const StudentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const [formData, setFormData] = useState({
    student_id: '',
    admission_number: '',
    name: '',
    date_of_birth: '',
    gender: 'Male',
    class_id: '',
    section_id: '',
    roll_number: '',
    father_name: '',
    mother_name: '',
    guardian_name: '',
    parent_phone: '',
    parent_email: '',
    address: '',
    emergency_contact: '',
    admission_date: '',
    status: 'active'
  });

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await classService.getClasses();
        setClasses(Array.isArray(res) ? res : (res?.data || []));
      } catch (err) {
        toast.error('Failed to load classes');
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (formData.class_id) {
        try {
          const res = await classService.getSections(formData.class_id);
          setSections(Array.isArray(res) ? res : (res?.data || []));
        } catch (err) {
          console.error(err);
        }
      } else {
        setSections([]);
      }
    };
    fetchSections();
  }, [formData.class_id]);

  useEffect(() => {
    const fetchStudent = async () => {
      if (isEditMode) {
        try {
          const res = await studentService.getStudent(id);
          const data = res?.data || res;
          setFormData({
            student_id: data.student_id || '',
            admission_number: data.admission_number || '',
            name: data.name || '',
            date_of_birth: data.date_of_birth ? data.date_of_birth.substring(0, 10) : '',
            gender: data.gender || 'Male',
            class_id: data.class_id || '',
            section_id: data.section_id || '',
            roll_number: data.roll_number || '',
            father_name: data.father_name || '',
            mother_name: data.mother_name || '',
            guardian_name: data.guardian_name || '',
            parent_phone: data.parent_phone || '',
            parent_email: data.parent_email || '',
            address: data.address || '',
            emergency_contact: data.emergency_contact || '',
            admission_date: data.admission_date ? data.admission_date.substring(0, 10) : '',
            status: data.status || 'active'
          });
        } catch (err) {
          toast.error('Failed to load student data');
          navigate('/students');
        } finally {
          setInitialLoading(false);
        }
      }
    };
    fetchStudent();
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset section if class changes
      ...(name === 'class_id' ? { section_id: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.admission_number || !formData.name) {
      toast.error('Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await studentService.updateStudent(id, formData);
        toast.success('Student updated successfully');
      } else {
        await studentService.createStudent(formData);
        toast.success('Student registered successfully');
      }
      navigate('/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-6 bg-gray-50 min-h-screen flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditMode ? 'Edit Student' : 'Register New Student'}
        </h1>
        
        <form onSubmit={handleSubmit}>
          
          {/* Section 1: Personal Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input type="text" name="student_id" value={formData.student_id} onChange={handleChange} readOnly={isEditMode}
                  className={`block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border ${isEditMode ? 'bg-gray-100' : ''}`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number *</label>
                <input type="text" name="admission_number" value={formData.admission_number} onChange={handleChange} readOnly={isEditMode}
                  className={`block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border ${isEditMode ? 'bg-gray-100' : ''}`} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Academic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select name="class_id" value={formData.class_id} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select name="section_id" value={formData.section_id} onChange={handleChange} disabled={!formData.class_id}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border disabled:bg-gray-100">
                  <option value="">Select Section</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input type="text" name="roll_number" value={formData.roll_number} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>
          </div>

          {/* Section 3: Parent/Guardian */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Parent/Guardian</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                <input type="text" name="father_name" value={formData.father_name} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian's Name</label>
                <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                <input type="text" name="parent_phone" value={formData.parent_phone} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                <input type="email" name="parent_email" value={formData.parent_email} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>
          </div>

          {/* Section 4: Contact & Others */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Contact & Others</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea name="address" rows="3" value={formData.address} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => navigate('/students')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StudentFormPage;
