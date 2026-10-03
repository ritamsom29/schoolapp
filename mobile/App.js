import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileApi from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login form states
  const [username, setUsername] = useState('rajesh');
  const [password, setPassword] = useState('teacher123');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard states
  const [teacherData, setTeacherData] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Attendance Screen states
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const info = await AsyncStorage.getItem('user_info');

      if (token && info) {
        setUser(JSON.parse(info));
        loadDashboard();
      }

      checkQueue();
    } catch (e) {
      // Ignore startup errors
    } finally {
      setLoading(false);
    }
  };

  const checkQueue = async () => {
    const queue = await mobileApi.getOfflineQueue();
    setOfflineQueueCount(queue.length);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoginLoading(true);

    try {
      const u = await mobileApi.login(username, password);

      setUser(u);
      loadDashboard();
    } catch (e) {
      console.log('LOGIN ERROR:', e);
      console.log('LOGIN ERROR MESSAGE:', e.message);
      console.log('LOGIN ERROR RESPONSE:', e.response?.data);
      console.log('LOGIN ERROR STATUS:', e.response?.status);

      const serverMessage =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.message ||
        'Unknown error';

      Alert.alert(
        'Login Error',
        `Status: ${e.response?.status || 'No response'}\n\n${serverMessage}`
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setUser(null);
    setSelectedClass(null);
  };

  const loadDashboard = async () => {
    try {
      const data = await mobileApi.getTeacherDashboard();
      setTeacherData(data);
    } catch (e) {
      if (e.response?.status === 401) {
        // Stale or invalid JWT token from previous local testing
        await AsyncStorage.clear();
        setUser(null);
        setSelectedClass(null);
        return;
      }

      const serverMessage =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        e.message ||
        'Unknown error';

      Alert.alert(
        'Dashboard Error',
        `Status: ${e.response?.status || 'No response'}\n\n${serverMessage}`
      );
    }
  };

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setStudentsLoading(true);

    try {
      const stuList = await mobileApi.getStudentsForClass(
        cls.class_id,
        cls.section_id
      );

      setStudents(stuList);

      // Initialize all to PRESENT
      const initMap = {};

      stuList.forEach((s) => {
        initMap[s.id] = 'PRESENT';
      });

      setAttendanceMap(initMap);
    } catch (e) {
      Alert.alert(
        'Error',
        'Unable to fetch students roster.'
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  const setStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const nextMap = {};

    students.forEach((s) => {
      nextMap[s.id] = status;
    });

    setAttendanceMap(nextMap);
  };

  const handleSubmitAttendance = async () => {
    if (students.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const records = students.map((s) => ({
      student_id: s.id,
      status: attendanceMap[s.id] || 'PRESENT',
    }));

    const payload = {
      class_id: selectedClass.class_id,
      section_id: selectedClass.section_id,
      date: todayStr,
      records,
    };

    try {
      await mobileApi.submitAttendance(payload);

      Alert.alert(
        'Success',
        'Attendance submitted successfully to school database!'
      );

      setSelectedClass(null);
      loadDashboard();
    } catch (err) {
      // Network failure or offline fallback
      await mobileApi.saveOfflineAttendance(payload);
      checkQueue();

      Alert.alert(
        'Offline Mode Recorded',
        'Attendance saved locally on device. It will automatically sync once online.'
      );

      setSelectedClass(null);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);

    try {
      const res = await mobileApi.syncOfflineAttendance();

      Alert.alert(
        'Sync Finished',
        `Synced: ${res.synced} classes | Failed: ${res.failed}`
      );

      checkQueue();
      loadDashboard();
    } catch (e) {
      Alert.alert(
        'Sync Error',
        'Could not sync records to server.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#4f46e5"
        />
      </View>
    );
  }

  // ── SCREEN 1: LOGIN ──────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.loginCard}>
          <Text style={styles.title}>
            Teacher Portal
          </Text>

          <Text style={styles.subtitle}>
            School Registration & Attendance
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Username (e.g. rajesh)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── SCREEN 2: ATTENDANCE TAKING SCREEN ───────────────────────
  if (selectedClass) {
    const presentCount = Object.values(
      attendanceMap
    ).filter((s) => s === 'PRESENT').length;

    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => setSelectedClass(null)}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>
              ‹ Back
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {selectedClass.class_name} - Sec{' '}
            {selectedClass.section_name}
          </Text>

          <Text style={styles.progressText}>
            {presentCount}/{students.length} P
          </Text>
        </View>

        {/* Quick batch buttons */}
        <View style={styles.batchRow}>
          <TouchableOpacity
            style={styles.batchBtn}
            onPress={() => markAll('PRESENT')}
          >
            <Text style={styles.batchBtnText}>
              All Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.batchBtn}
            onPress={() => markAll('ABSENT')}
          >
            <Text style={styles.batchBtnText}>
              All Absent
            </Text>
          </TouchableOpacity>
        </View>

        {studentsLoading ? (
          <ActivityIndicator
            style={{ marginTop: 40 }}
            color="#4f46e5"
          />
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const currentStatus =
                attendanceMap[item.id] || 'PRESENT';

              return (
                <View style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.rollNumber}>
                      {item.roll_number || '0'}
                    </Text>

                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.studentName}>
                        {item.name}
                      </Text>

                      <Text style={styles.studentId}>
                        {item.student_id}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusButtonsGroup}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        currentStatus === 'PRESENT' &&
                          styles.toggleBtnActiveGreen,
                      ]}
                      onPress={() =>
                        setStatus(item.id, 'PRESENT')
                      }
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          currentStatus === 'PRESENT' &&
                            styles.toggleBtnTextActive,
                        ]}
                      >
                        P
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        currentStatus === 'ABSENT' &&
                          styles.toggleBtnActiveRed,
                      ]}
                      onPress={() =>
                        setStatus(item.id, 'ABSENT')
                      }
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          currentStatus === 'ABSENT' &&
                            styles.toggleBtnTextActive,
                        ]}
                      >
                        A
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Big Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitAttendance}
        >
          <Text style={styles.submitButtonText}>
            Submit Attendance
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── SCREEN 3: TEACHER DASHBOARD ─────────────────────────────
  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.welcomeText}>
            Welcome,
          </Text>

          <Text style={styles.teacherNameText}>
            {user.teacher_name || user.username}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutBtnText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline Sync Banner if pending queue */}
      {offlineQueueCount > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            {offlineQueueCount} attendance record(s) queued offline.
          </Text>

          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleSyncNow}
            disabled={isSyncing}
          >
            <Text style={styles.syncBtnText}>
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionHeader}>
        Your Assigned Classes
      </Text>

      {teacherData?.assigned_classes?.length === 0 ? (
        <Text style={styles.emptyText}>
          No classes currently assigned.
        </Text>
      ) : (
        <FlatList
          data={teacherData?.assigned_classes || []}
          keyExtractor={(item, idx) =>
            `${item.class_id}-${item.section_id}-${idx}`
          }
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.classCard}
              onPress={() => handleSelectClass(item)}
            >
              <View>
                <Text style={styles.classCardTitle}>
                  {item.class_name} - Section{' '}
                  {item.section_name}
                </Text>

                <Text style={styles.classCardSub}>
                  {item.total_students} Students enrolled
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  item.attendance_completed_today
                    ? styles.statusBadgeGreen
                    : styles.statusBadgeAmber,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.attendance_completed_today
                      ? styles.statusBadgeTextGreen
                      : styles.statusBadgeTextAmber,
                  ]}
                >
                  {item.attendance_completed_today
                    ? 'Completed'
                    : 'Take Attendance'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginCard: {
    margin: 24,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 100,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e1b4b',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },

  primaryButton: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  welcomeText: {
    fontSize: 12,
    color: '#64748b',
  },

  teacherNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },

  logoutBtn: {
    padding: 8,
  },

  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },

  syncBanner: {
    backgroundColor: '#eff6ff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },

  syncText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
  },

  syncBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  syncBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  classCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  classCardSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusBadgeGreen: {
    backgroundColor: '#dcfce7',
  },

  statusBadgeAmber: {
    backgroundColor: '#fef3c7',
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  statusBadgeTextGreen: {
    color: '#15803d',
  },

  statusBadgeTextAmber: {
    color: '#b45309',
  },

  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 30,
  },

  backBtn: {
    paddingRight: 10,
  },

  backBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4f46e5',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },

  batchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  batchBtn: {
    flex: 1,
    backgroundColor: '#e0e7ff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  batchBtnText: {
    color: '#3730a3',
    fontWeight: '700',
    fontSize: 12,
  },

  studentCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rollNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748b',
    width: 24,
  },

  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },

  studentId: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },

  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },

  toggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  toggleBtnActiveGreen: {
    backgroundColor: '#16a34a',
  },

  toggleBtnActiveRed: {
    backgroundColor: '#dc2626',
  },

  toggleBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },

  toggleBtnTextActive: {
    color: '#ffffff',
  },

  submitButton: {
    backgroundColor: '#4f46e5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});