import { apiFetch } from './apiConfig';

class AdminService {
  async getDashboardOverview() {
    try {
      return await apiFetch('/admin/dashboard/overview');
    } catch (error) {
      console.warn('Admin overview fetch fallback:', error.message);
      return null;
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
      return await apiFetch('/admin/students');
    } catch (error) {
      console.warn('Admin students fetch fallback:', error.message);
      return null;
    }
  }

  async uploadStudentSpreadsheet(fileBase64, fileName = 'students.xlsx') {
    return await apiFetch('/admin/students/upload', {
      method: 'POST',
      body: JSON.stringify({ fileBase64, fileName }),
      timeout: 60000,
    });
  }

  async getStaff() {
    try {
      return await apiFetch('/admin/staff');
    } catch (error) {
      console.warn('Admin staff fetch fallback:', error.message);
      return null;
    }
  }

  async uploadStaffSpreadsheet(fileBase64, fileName = 'staff.xlsx') {
    return await apiFetch('/admin/staff/upload', {
      method: 'POST',
      body: JSON.stringify({ fileBase64, fileName }),
      timeout: 60000,
    });
  }

  async getDevices() {
    try {
      return await apiFetch('/admin/devices/list');
    } catch (error) {
      console.warn('Admin devices list fetch fallback:', error.message);
      return null;
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
}

export default new AdminService();
