/**
 * staffService — Staff API Service
 * Smart Classroom Mobile Usage Control System
 */

import {
  BASE_URL,
  apiFetch,
  saveTokens,
  getRefreshToken,
} from './apiConfig';

// ─── Auto-refresh wrapper ─────────────────────────────────────────────────────
/**
 * Calls apiFetch; on 401 tokenExpired, refreshes the access token and retries once.
 */
const fetchWithRefresh = async (path, options = {}) => {
  try {
    return await apiFetch(path, options);
  } catch (err) {
    if (err.status === 401 && err.data?.tokenExpired) {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw err;

      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) throw err;

      const refreshData = await refreshRes.json();
      if (!refreshData.accessToken) throw err;

      await saveTokens(refreshData.accessToken, refreshData.refreshToken || refreshToken);

      return await apiFetch(path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshData.accessToken}`,
        },
      });
    }
    throw err;
  }
};

// ─── My Classes ───────────────────────────────────────────────────────────────
export const fetchMyClasses = async () => {
  return fetchWithRefresh('/staff/my-classes');
};

// ─── Live Status ──────────────────────────────────────────────────────────────
export const fetchClassLiveStatus = async (classRoomId) => {
  return fetchWithRefresh(`/staff/classes/${classRoomId}/live`);
};

// ─── Student Activity ──────────────────────────────────────────────────────────
export const fetchClassActivity = async (classRoomId, studentId, startDate, endDate) => {
  const query = [];
  if (studentId) query.push(`studentId=${studentId}`);
  if (startDate) query.push(`startDate=${startDate}`);
  if (endDate) query.push(`endDate=${endDate}`);
  const queryString = query.length > 0 ? `?${query.join('&')}` : '';
  return fetchWithRefresh(`/staff/classes/${classRoomId}/activity${queryString}`);
};

// ─── Class Rules / Policies ────────────────────────────────────────────────────
export const fetchClassRules = async (classRoomId) => {
  return fetchWithRefresh(`/staff/classes/${classRoomId}/rules`);
};

export const createClassRule = async (classRoomId, ruleData) => {
  return fetchWithRefresh(`/staff/classes/${classRoomId}/rules`, {
    method: 'POST',
    body: JSON.stringify(ruleData),
  });
};

export const updateClassRule = async (classRoomId, ruleId, ruleData) => {
  return fetchWithRefresh(`/staff/classes/${classRoomId}/rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(ruleData),
  });
};

export const sendClassRuleCommand = async (classRoomId, ruleId, action) => {
  return fetchWithRefresh(`/staff/classes/${classRoomId}/rules/${ruleId}/command`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
};

export const pauseClassRestriction = async (classRoomId) => {
  return fetchWithRefresh(`/staff/classes/${classRoomId}/override/pause`, {
    method: 'POST',
  });
};

export const resumeClassRestriction = async (classRoomId) => {
  return fetchWithRefresh(`/staff/classes/${classRoomId}/override/resume`, {
    method: 'POST',
  });
};

export const fetchStaffNotifications = async () => {
  return fetchWithRefresh('/staff/notifications');
};

// ─── Change Password ───────────────────────────────────────────────────────────
export const changePassword = async (currentPassword, newPassword) => {
  return fetchWithRefresh('/staff/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

// ─── Update Profile ────────────────────────────────────────────────────────────
export const updateProfile = async (profileData) => {
  return fetchWithRefresh('/staff/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
};

export default {
  fetchMyClasses,
  fetchClassLiveStatus,
  fetchClassActivity,
  fetchClassRules,
  createClassRule,
  updateClassRule,
  sendClassRuleCommand,
  pauseClassRestriction,
  resumeClassRestriction,
  fetchStaffNotifications,
  changePassword,
  updateProfile,
};
