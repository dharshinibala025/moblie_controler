import { apiFetch } from './apiConfig';

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

  async updateAdminProfile({ name, email }) {
    return await apiFetch('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    });
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

  async applyRestrictionPolicyBulk(policyData) {
    return await apiFetch('/admin/rules/bulk', {
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

  async pauseRestriction(targetClassIds = []) {
    return await apiFetch('/admin/override/pause', {
      method: 'POST',
      body: JSON.stringify({ targetClassIds }),
    });
  }

  async resumeRestriction(targetClassIds = []) {
    return await apiFetch('/admin/override/resume', {
      method: 'POST',
      body: JSON.stringify({ targetClassIds }),
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

  async createStudent(studentData) {
    return await apiFetch('/admin/users/student', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(userId, updateData) {
    return await apiFetch(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async deleteStudent(userId) {
    return await apiFetch(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async blockStudent(userId) {
    return await apiFetch(`/admin/users/${userId}/block`, {
      method: 'POST',
    });
  }

  async unblockStudent(userId) {
    return await apiFetch(`/admin/users/${userId}/unblock`, {
      method: 'POST',
    });
  }

  async createStaff(staffData) {
    return await apiFetch('/admin/users/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaff(userId, updateData) {
    return await apiFetch(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async deleteStaff(userId) {
    return await apiFetch(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async blockStaff(userId) {
    return await apiFetch(`/admin/users/${userId}/block`, {
      method: 'POST',
    });
  }

  async unblockStaff(userId) {
    return await apiFetch(`/admin/users/${userId}/unblock`, {
      method: 'POST',
    });
  }
}
export default new AdminService();
