import api from './api';

export const dashboardService = {
  getAdminStats: async () => {
    const response = await api.get('/dashboard/statistics');
    return response.data;
  },

  getTeacherStats: async () => {
    const response = await api.get('/dashboard/teacher');
    return response.data;
  },
};

export default dashboardService;
