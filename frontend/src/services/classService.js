import api from './api';

export const classService = {
  getClasses: async () => {
    const response = await api.get('/classes');
    return response.data;
  },
  getSections: async (classId) => {
    const response = await api.get('/sections', { params: { class_id: classId } });
    return response.data;
  },
};

export default classService;
