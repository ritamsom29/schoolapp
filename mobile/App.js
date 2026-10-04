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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileApi from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Bottom Tab: 'classes' | 'history' | 'holidays' | 'profile'
  const [activeTab, setActiveTab] = useState('classes');

  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  // History Tab states
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Holidays Tab states
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  // Profile / Password change states
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

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
    setActiveTab('classes');
  };

  const loadDashboard = async () => {
    try {
      const data = await mobileApi.getTeacherDashboard();
      setTeacherData(data);
    } catch (e) {
      if (e.response?.status === 401) {
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

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await mobileApi.getAttendanceHistory();
      setHistoryRecords(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch attendance history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadHolidays = async () => {
    setHolidaysLoading(true);
    try {
      const data = await mobileApi.getHolidays();
      setHolidays(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch school calendar');
    } finally {
      setHolidaysLoading(false);
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

      const initMap = {};
      stuList.forEach((s) => {
        initMap[s.id] = 'PRESENT';
      });

      setAttendanceMap(initMap);
    } catch (e) {
      Alert.alert('Error', 'Unable to fetch students roster.');
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
      Alert.alert('Sync Error', 'Could not sync records to server.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert('Error', 'Please fill in current and new password');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      await mobileApi.changePassword(currentPw, newPw);
      Alert.alert('Success', 'Password updated successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.detail || 'Could not update password');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // ── SCREEN 1: LOGIN ──────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.title}>EduManage Portal</Text>
          <Text style={styles.subtitle}>Teacher Attendance & Registration</Text>

          <TextInput
            style={styles.input}
            placeholder="Username or Teacher ID"
            placeholderTextColor="#94a3b8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
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
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── SCREEN 2: TAKE ATTENDANCE (MODAL VIEW) ───────────────────
  if (selectedClass) {
    const presentCount = Object.values(attendanceMap).filter(
      (s) => s === 'PRESENT'
    ).length;

    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => setSelectedClass(null)}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {selectedClass.class_name} - Sec {selectedClass.section_name}
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
            <Text style={styles.batchBtnText}>All Present</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.batchBtn}
            onPress={() => markAll('ABSENT')}
          >
            <Text style={styles.batchBtnText}>All Absent</Text>
          </TouchableOpacity>
        </View>

        {studentsLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const currentStatus = attendanceMap[item.id] || 'PRESENT';

              return (
                <View style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.rollNumber}>{item.roll_number || '0'}</Text>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.studentName}>{item.name}</Text>
                      <Text style={styles.studentId}>{item.student_id}</Text>
                    </View>
                  </View>

                  <View style={styles.statusButtonsGroup}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        currentStatus === 'PRESENT' && styles.toggleBtnActiveGreen,
                      ]}
                      onPress={() => setStatus(item.id, 'PRESENT')}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          currentStatus === 'PRESENT' && styles.toggleBtnTextActive,
                        ]}
                      >
                        P
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        currentStatus === 'ABSENT' && styles.toggleBtnActiveRed,
                      ]}
                      onPress={() => setStatus(item.id, 'ABSENT')}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          currentStatus === 'ABSENT' && styles.toggleBtnTextActive,
                        ]}
                      >
                        A
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        currentStatus === 'LEAVE' && styles.toggleBtnActiveBlue,
                      ]}
                      onPress={() => setStatus(item.id, 'LEAVE')}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          currentStatus === 'LEAVE' && styles.toggleBtnTextActive,
                        ]}
                      >
                        L
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitAttendance}
        >
          <Text style={styles.submitButtonText}>Submit Attendance</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── SCREEN 3: MULTI-TAB TEACHER APPLICATION ──────────────────
  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.welcomeText}>Logged in as</Text>
          <Text style={styles.teacherNameText}>
            {user.teacher_name || user.username}
          </Text>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Sync Banner if pending */}
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

      {/* ── TAB 1: ASSIGNED CLASSES & ATTENDANCE ── */}
      {activeTab === 'classes' && (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeader}>Your Assigned Classes</Text>

          {teacherData?.assigned_classes?.length === 0 ? (
            <Text style={styles.emptyText}>No classes currently assigned.</Text>
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
                      {item.class_name} - Section {item.section_name}
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
        </View>
      )}

      {/* ── TAB 2: ATTENDANCE HISTORY ── */}
      {activeTab === 'history' && (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeader}>Recent Attendance Records</Text>
          {historyLoading ? (
            <ActivityIndicator style={{ marginTop: 30 }} color="#4f46e5" />
          ) : historyRecords.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records found.</Text>
          ) : (
            <FlatList
              data={historyRecords.slice(0, 50)}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View>
                    <Text style={styles.historyName}>{item.student_name || 'Student'}</Text>
                    <Text style={styles.historySub}>
                      {item.class_name} {item.section_name} • {item.date}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.historyBadge,
                      item.status === 'PRESENT' && styles.statusBadgeGreen,
                      item.status === 'ABSENT' && styles.statusBadgeRed,
                      item.status === 'LEAVE' && styles.statusBadgeBlue,
                      item.status === 'LATE' && styles.statusBadgeAmber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'PRESENT' && styles.statusBadgeTextGreen,
                        item.status === 'ABSENT' && styles.statusBadgeTextRed,
                        item.status === 'LEAVE' && styles.statusBadgeTextBlue,
                        item.status === 'LATE' && styles.statusBadgeTextAmber,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* ── TAB 3: SCHOOL HOLIDAYS ── */}
      {activeTab === 'holidays' && (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionHeader}>School Calendar & Holidays</Text>
          {holidaysLoading ? (
            <ActivityIndicator style={{ marginTop: 30 }} color="#4f46e5" />
          ) : holidays.length === 0 ? (
            <Text style={styles.emptyText}>No holidays scheduled.</Text>
          ) : (
            <FlatList
              data={holidays}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.holidayCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.holidayName}>{item.name}</Text>
                    <Text style={styles.holidayDesc}>{item.description || 'Public / School Holiday'}</Text>
                  </View>
                  <Text style={styles.holidayDate}>{item.date}</Text>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* ── TAB 4: TEACHER PROFILE & PASSWORD ── */}
      {activeTab === 'profile' && (
        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={styles.sectionHeader}>Teacher Profile</Text>

          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Full Name</Text>
            <Text style={styles.profileValue}>{user.teacher_name || user.username}</Text>

            <Text style={styles.profileLabel}>Teacher ID</Text>
            <Text style={styles.profileValue}>{user.teacher_id || 'TCH-001'}</Text>

            <Text style={styles.profileLabel}>Email</Text>
            <Text style={styles.profileValue}>{user.email}</Text>

            <Text style={styles.profileLabel}>Role</Text>
            <Text style={styles.profileValue}>{user.role.toUpperCase()}</Text>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Change Password</Text>
          <View style={styles.profileCard}>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPw}
              onChangeText={setCurrentPw}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password (min 6 chars)"
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleChangePassword}
              disabled={pwLoading}
            >
              {pwLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('classes')}
        >
          <Text style={[styles.navText, activeTab === 'classes' && styles.navTextActive]}>
            Classes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('holidays');
            loadHolidays();
          }}
        >
          <Text style={[styles.navText, activeTab === 'holidays' && styles.navTextActive]}>
            Holidays
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
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
    marginTop: 16,
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
  statusBadgeRed: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeBlue: {
    backgroundColor: '#e0e7ff',
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
  statusBadgeTextRed: {
    color: '#b91c1c',
  },
  statusBadgeTextBlue: {
    color: '#4338ca',
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
    width: 36,
    height: 36,
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
  toggleBtnActiveBlue: {
    backgroundColor: '#2563eb',
  },
  toggleBtnText: {
    fontSize: 13,
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
  historyCard: {
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
  historyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  historySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  holidayCard: {
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
  holidayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  holidayDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  holidayDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  profileLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 8,
  },
  profileValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    height: 56,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  navTextActive: {
    color: '#4f46e5',
    fontWeight: '800',
  },
});