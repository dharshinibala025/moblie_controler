import { apiFetch } from './apiConfig';

export const MOCK_STUDENTS = [
  {
    id: 's1',
    name: 'Dharani V V',
    registerNumber: '221CS001',
    email: 'vvdharani57cse24_27@ksrce.ac.in',
    department: 'CSE',
    year: '1st Year',
    section: 'A',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: true,
  },
  {
    id: 's2',
    name: 'Aarav Sharma',
    registerNumber: '221CS002',
    email: 'aarav.sharma@ksrce.ac.in',
    department: 'CSE',
    year: '1st Year',
    section: 'B',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's3',
    name: 'Bhavna Ramesh',
    registerNumber: '221CS003',
    email: 'bhavna.r@ksrce.ac.in',
    department: 'CSE',
    year: '1st Year',
    section: 'C',
    accountStatus: 'Blocked',
    isBlocked: true,
  },
  {
    id: 's4',
    name: 'Chandran K',
    registerNumber: '221CS004',
    email: 'chandran.k@ksrce.ac.in',
    department: 'CSE',
    year: '1st Year',
    section: 'D',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's5',
    name: 'Deepak Kumar',
    registerNumber: '221CS015',
    email: 'deepak.k@ksrce.ac.in',
    department: 'CSE',
    year: '2nd Year',
    section: 'A',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's6',
    name: 'Ezhil Raj',
    registerNumber: '221CS016',
    email: 'ezhil.r@ksrce.ac.in',
    department: 'CSE',
    year: '2nd Year',
    section: 'B',
    accountStatus: 'Blocked',
    isBlocked: true,
  },
  {
    id: 's7',
    name: 'Farhana Parveen',
    registerNumber: '221CS017',
    email: 'farhana.p@ksrce.ac.in',
    department: 'CSE',
    year: '2nd Year',
    section: 'C',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's8',
    name: 'Gokul Nath',
    registerNumber: '221CS018',
    email: 'gokul.n@ksrce.ac.in',
    department: 'CSE',
    year: '2nd Year',
    section: 'D',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's9',
    name: 'Harini M',
    registerNumber: '221CS030',
    email: 'harini.m@ksrce.ac.in',
    department: 'CSE',
    year: '3rd Year',
    section: 'A',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's10',
    name: 'Inian S',
    registerNumber: '221CS031',
    email: 'inian.s@ksrce.ac.in',
    department: 'CSE',
    year: '3rd Year',
    section: 'B',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's11',
    name: 'Javith Ahammad',
    registerNumber: '221CS032',
    email: 'javith.a@ksrce.ac.in',
    department: 'CSE',
    year: '3rd Year',
    section: 'C',
    accountStatus: 'Blocked',
    isBlocked: true,
  },
  {
    id: 's12',
    name: 'Kavya P',
    registerNumber: '221CS033',
    email: 'kavya.p@ksrce.ac.in',
    department: 'CSE',
    year: '3rd Year',
    section: 'D',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's13',
    name: 'Lokesh V',
    registerNumber: '221CS050',
    email: 'lokesh.v@ksrce.ac.in',
    department: 'CSE',
    year: '4th Year',
    section: 'A',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's14',
    name: 'Meena Kumari',
    registerNumber: '221CS051',
    email: 'meena.k@ksrce.ac.in',
    department: 'CSE',
    year: '4th Year',
    section: 'B',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 's15',
    name: 'Naveen Kumar',
    registerNumber: '221CS052',
    email: 'naveen.k@ksrce.ac.in',
    department: 'CSE',
    year: '4th Year',
    section: 'C',
    accountStatus: 'Blocked',
    isBlocked: true,
  },
  {
    id: 's16',
    name: 'Oviya R',
    registerNumber: '221CS053',
    email: 'oviya.r@ksrce.ac.in',
    department: 'CSE',
    year: '4th Year',
    section: 'D',
    accountStatus: 'Active',
    isBlocked: false,
  },
];

export const MOCK_STAFF = [
  {
    id: 'st1',
    staffId: 'STF101',
    name: 'Dr. R. Sundaram',
    email: 'sundaram.r@ksrce.ac.in',
    department: 'Computer Science',
    assignedAdvisor: '1st Year CSE - Section A',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 'st2',
    staffId: 'STF102',
    name: 'Prof. Anitha Parthiban',
    email: 'anitha.p@ksrce.ac.in',
    department: 'Computer Science',
    assignedAdvisor: '1st Year CSE - Section B',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 'st3',
    staffId: 'STF103',
    name: 'Dr. Karthik Raja',
    email: 'karthik.r@ksrce.ac.in',
    department: 'Computer Science',
    assignedAdvisor: '2nd Year CSE - Section A',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 'st4',
    staffId: 'STF104',
    name: 'Mrs. S. Lakshmi',
    email: 'lakshmi.s@ksrce.ac.in',
    department: 'Computer Science',
    assignedAdvisor: '3rd Year CSE - Section A',
    accountStatus: 'Active',
    isBlocked: false,
  },
  {
    id: 'st5',
    staffId: 'STF105',
    name: 'Mr. V. Balaji',
    email: 'balaji.v@ksrce.ac.in',
    department: 'Computer Science',
    assignedAdvisor: '4th Year CSE - Section A',
    accountStatus: 'Active',
    isBlocked: false,
  },
];

export const MOCK_DEVICES = [
  {
    id: 'dev1',
    deviceId: 'DEV-8921',
    studentName: 'Dharani V V',
    rollNo: '221CS001',
    model: 'Samsung Galaxy S22',
    status: 'Unblocked',
    isBlocked: false,
    restrictedAppsCount: 3,
    activeTime: '2h 15m',
    lastPing: 'Just now',
  },
  {
    id: 'dev2',
    deviceId: 'DEV-4820',
    studentName: 'Bhavna Ramesh',
    rollNo: '221CS003',
    model: 'OnePlus 11R',
    status: 'Blocked',
    isBlocked: true,
    restrictedAppsCount: 5,
    activeTime: '4h 10m',
    lastPing: '5m ago',
  },
  {
    id: 'dev3',
    deviceId: 'DEV-3319',
    studentName: 'Ezhil Raj',
    rollNo: '221CS016',
    model: 'Xiaomi Redmi Note 12',
    status: 'Blocked',
    isBlocked: true,
    restrictedAppsCount: 4,
    activeTime: '3h 45m',
    lastPing: '12m ago',
  },
  {
    id: 'dev4',
    deviceId: 'DEV-7712',
    studentName: 'Aarav Sharma',
    rollNo: '221CS002',
    model: 'Realme GT Neo 3',
    status: 'Unblocked',
    isBlocked: false,
    restrictedAppsCount: 2,
    activeTime: '1h 50m',
    lastPing: '1m ago',
  },
  {
    id: 'dev5',
    deviceId: 'DEV-5541',
    studentName: 'Harini M',
    rollNo: '221CS030',
    model: 'iPhone 13',
    status: 'Unblocked',
    isBlocked: false,
    restrictedAppsCount: 1,
    activeTime: '0h 45m',
    lastPing: '3m ago',
  },
];

export const MOCK_DASHBOARD_OVERVIEW = {
  stats: [
    {
      id: 'total-students',
      icon: 'school',
      label: 'Total Students',
      value: '16',
      iconColor: '#2563EB',
      iconBackground: '#EFF6FF',
      trend: '+12%',
      trendPositive: true,
    },
    {
      id: 'total-staff',
      icon: 'groups',
      label: 'Total Staff',
      value: '5',
      iconColor: '#0284C7',
      iconBackground: '#EFF6FF',
      trend: '100%',
      trendPositive: true,
    },
    {
      id: 'connected-phones',
      icon: 'smartphone',
      label: 'Connected Phones',
      value: '12',
      iconColor: '#16A34A',
      iconBackground: '#DCFCE7',
      trend: '+8%',
      trendPositive: true,
    },
    {
      id: 'blocked-phones',
      icon: 'phonelink-erase',
      label: 'Blocked Phones',
      value: '4',
      iconColor: '#EF4444',
      iconBackground: '#FEE2E2',
      trend: '-5%',
      trendPositive: false,
    },
  ],
  recentActivities: [
    {
      id: 'act1',
      icon: 'person-add',
      title: 'New student registered',
      description: 'Dharani V V joined CSE - 1st Year Section A',
      time: '2m ago',
      iconColor: '#2563EB',
      iconBackground: '#EFF6FF',
    },
    {
      id: 'act2',
      icon: 'phonelink-erase',
      title: 'Device blocked',
      description: 'Unauthorized app detected on DEV-4820 (Bhavna Ramesh)',
      time: '18m ago',
      iconColor: '#EF4444',
      iconBackground: '#FEE2E2',
    },
    {
      id: 'act3',
      icon: 'campaign',
      title: 'Announcement sent',
      description: 'Exam Mobile Usage Policy broadcasted to All Students',
      time: '45m ago',
      iconColor: '#0284C7',
      iconBackground: '#EFF6FF',
    },
  ],
};

class AdminService {
  async getDashboardOverview() {
    try {
      const res = await apiFetch('/admin/dashboard/overview');
      return res || { stats: [], recentActivities: [] };
    } catch (error) {
      console.warn('Admin overview fetch fallback:', error.message);
      return { stats: [], recentActivities: [] };
    }
  }

  async broadcastAnnouncement({ title, message, target }) {
    return await apiFetch('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, message, target }),
    });
  }

  async getStudents() {
    try {
      const res = await apiFetch('/admin/students');
      return res && Array.isArray(res) ? res : [];
    } catch (error) {
      console.warn('Admin students fetch fallback:', error.message);
      return [];
    }
  }

  async uploadStudentSpreadsheet(fileBase64, fileName = 'students.xlsx') {
    try {
      await apiFetch('/health', { method: 'GET', timeout: 5000 }).catch(() => {});
    } catch (_) {}
    return await apiFetch('/admin/students/upload', {
      method: 'POST',
      body: JSON.stringify({ fileBase64, fileName }),
      timeout: 120000,
    });
  }

  async getStaff() {
    try {
      const res = await apiFetch('/admin/staff');
      return res && Array.isArray(res) ? res : [];
    } catch (error) {
      console.warn('Admin staff fetch fallback:', error.message);
      return [];
    }
  }

  async uploadStaffSpreadsheet(fileBase64, fileName = 'staff.xlsx') {
    try {
      await apiFetch('/health', { method: 'GET', timeout: 5000 }).catch(() => {});
    } catch (_) {}
    return await apiFetch('/admin/staff/upload', {
      method: 'POST',
      body: JSON.stringify({ fileBase64, fileName }),
      timeout: 120000,
    });
  }

  async getDevices() {
    try {
      const res = await apiFetch('/admin/devices/list');
      return res && Array.isArray(res) ? res : [];
    } catch (error) {
      console.warn('Admin devices list fetch fallback:', error.message);
      return [];
    }
  }

  async blockDevice(deviceId) {
    return await apiFetch(`/admin/devices/${deviceId}/block`, {
      method: 'POST',
    });
  }

  async unblockDevice(deviceId) {
    return await apiFetch(`/admin/devices/${deviceId}/unblock`, {
      method: 'POST',
    });
  }

  async emergencyUnblockAll() {
    return await apiFetch('/admin/emergency-unblock-all', {
      method: 'POST',
    });
  }

  async getBlockableApps() {
    try {
      return await apiFetch('/admin/apps/blockable');
    } catch (error) {
      console.warn('Blockable apps fetch fallback:', error.message);
      return null;
    }
  }

  async getAdminProfile() {
    try {
      return await apiFetch('/admin/profile');
    } catch (error) {
      console.warn('Admin profile fetch fallback:', error.message);
      return null;
    }
  }

  async changePassword(currentPassword, newPassword) {
    return await apiFetch('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async applyRestrictionPolicy(policyData) {
    return await apiFetch('/admin/rules', {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  }

  async deleteActivity(activityId) {
    try {
      return await apiFetch(`/admin/activity/${activityId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Delete activity API fallback:', error.message);
      return null;
    }
  }

  async getRules(filters = {}) {
    try {
      const query = [];
      if (filters.targetClassId) query.push(`targetClassId=${filters.targetClassId}`);
      if (filters.status) query.push(`status=${filters.status}`);
      const queryString = query.length > 0 ? `?${query.join('&')}` : '';
      const res = await apiFetch(`/admin/rules${queryString}`);
      return res && Array.isArray(res) ? res : [];
    } catch (error) {
      console.warn('Admin rules fetch fallback:', error.message);
      return [];
    }
  }

  async pauseRestriction() {
    return await apiFetch('/admin/override/pause', {
      method: 'POST',
    });
  }

  async resumeRestriction() {
    return await apiFetch('/admin/override/resume', {
      method: 'POST',
    });
  }

  async getAdminNotifications() {
    try {
      const res = await apiFetch('/admin/notifications');
      return res && Array.isArray(res) ? res : [];
    } catch (error) {
      console.warn('Admin getNotifications fallback:', error.message);
      return [];
    }
  }

  async deleteAdminNotification(id) {
    return await apiFetch(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async markAllNotificationsRead() {
    return await apiFetch('/admin/notifications/mark-read', {
      method: 'POST',
    });
  }
}

export default new AdminService();
