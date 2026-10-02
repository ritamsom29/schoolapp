import api from './api';

export const attendanceService = {
  submitAttendance: async (data) => {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  getAttendance: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== '' && val !== null && val !== undefined) {
        cleanParams[key] = val;
      }
    });
    const response = await api.get('/attendance', { params: cleanParams });
    return response.data;
  },

  updateAttendance: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  getStudentAttendanceStats: async (studentId) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  },
};

export default attendanceService;
