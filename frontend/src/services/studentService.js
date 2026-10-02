import api from './api';

export const studentService = {
  getStudents: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== '' && val !== null && val !== undefined) {
        cleanParams[key] = val;
      }
    });
    const response = await api.get('/students', { params: cleanParams });
    return response.data;
  },
  getStudent: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  createStudent: async (data) => {
    const response = await api.post('/students', data);
    return response.data;
  },
  updateStudent: async (id, data) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },
  deactivateStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};

export default studentService;
