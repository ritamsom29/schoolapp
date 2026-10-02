import api from './api';

export const teacherService = {
  getTeachers: async (params = {}) => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },

  getTeacher: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  createTeacher: async (data) => {
    const response = await api.post('/teachers', data);
    return response.data;
  },

  updateTeacher: async (id, data) => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },

  deactivateTeacher: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  assignTeacher: async (data) => {
    const response = await api.post('/teachers/assign', data);
    return response.data;
  },

  removeAssignment: async (assignmentId) => {
    const response = await api.delete(`/teachers/assign/${assignmentId}`);
    return response.data;
  },
};

export default teacherService;
