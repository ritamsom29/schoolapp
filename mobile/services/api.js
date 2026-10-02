import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 5000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const mobileApi = {
  login: async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    await AsyncStorage.setItem('user_token', res.data.access_token);
    const meRes = await client.get('/auth/me');
    await AsyncStorage.setItem('user_info', JSON.stringify(meRes.data));
    return meRes.data;
  },

  getTeacherDashboard: async () => {
    const res = await client.get('/dashboard/teacher');
    return res.data;
  },

  getStudentsForClass: async (classId, sectionId) => {
    const res = await client.get('/students', {
      params: { class_id: classId, section_id: sectionId, status: 'active', page_size: 100 },
    });
    return res.data.students || [];
  },

  submitAttendance: async (payload) => {
    const res = await client.post('/attendance', payload);
    return res.data;
  },

  // ── Offline Queue Management (Phase 11) ──────────────────────
  saveOfflineAttendance: async (payload) => {
    try {
      const existing = await AsyncStorage.getItem('offline_attendance_queue');
      const queue = existing ? JSON.parse(existing) : [];
      queue.push({ ...payload, queued_at: new Date().toISOString() });
      await AsyncStorage.setItem('offline_attendance_queue', JSON.stringify(queue));
      return true;
    } catch (e) {
      return false;
    }
  },

  getOfflineQueue: async () => {
    const existing = await AsyncStorage.getItem('offline_attendance_queue');
    return existing ? JSON.parse(existing) : [];
  },

  clearOfflineQueue: async () => {
    await AsyncStorage.removeItem('offline_attendance_queue');
  },

  syncOfflineAttendance: async () => {
    const queue = await mobileApi.getOfflineQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        await client.post('/attendance', {
          class_id: item.class_id,
          section_id: item.section_id,
          date: item.date,
          records: item.records,
        });
        synced++;
      } catch (err) {
        // If already submitted on server, ignore duplicate error
        if (err.response?.status === 400 && err.response?.data?.detail?.includes('already been recorded')) {
          synced++;
        } else {
          failed++;
          remaining.push(item);
        }
      }
    }

    await AsyncStorage.setItem('offline_attendance_queue', JSON.stringify(remaining));
    return { synced, failed, remaining: remaining.length };
  },
};

export default mobileApi;
