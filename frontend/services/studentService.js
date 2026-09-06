/**
 * studentService — Student API Service
 * Smart Classroom Mobile Usage Control System
 *
 * All routes require a valid Bearer token.
 * Endpoints:
 *   GET /student/dashboard     → full dashboard data
 *   GET /student/apps          → all scanned apps with blocked status
 *   GET /student/notifications → all notifications (limit 50)
 *   POST /student/notifications/:id/read → mark one as read
 *
 * Token refresh on 401 (tokenExpired) is handled here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  apiFetch,
  getAccessToken,
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
      // Try to refresh
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

      // Retry original request with new token
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

// ─── Dashboard ────────────────────────────────────────────────────────────────
/**
 * GET /student/dashboard
 *
 * Returns:
 * {
 *   student: { id, name, registerNumber, department, section, email, classId },
 *   restrictionStatus: { isActive, statusTitle, schedule, remainingTime, reason, noticeText },
 *   blockedApps: [{ id, name, packageName, category, blocked }],
 *   recentActivity: [{ id, time, type, title, details }],
 *   deviceStatus: { status, lastSeenAt },
 *   unreadNotificationCount: number,
 *   blockedAppsCount: number,
 *   scannedAppsCount: number,
 * }
 */
export const fetchDashboard = async () => {
  return fetchWithRefresh('/student/dashboard');
};

// ─── Apps ─────────────────────────────────────────────────────────────────────
/**
 * GET /student/apps
 *
 * Returns:
 * {
 *   apps: [{ id, name, packageName, category, versionName, blocked, scannedAt }]
 * }
 */
export const fetchApps = async () => {
  return fetchWithRefresh('/student/apps');
};

// ─── Notifications ────────────────────────────────────────────────────────────
/**
 * GET /student/notifications
 *
 * Returns:
 * {
 *   notifications: [{ _id, title, message, type, read, createdAt, metadata }]
 * }
 */
export const fetchNotifications = async () => {
  return fetchWithRefresh('/student/notifications');
};

/**
 * GET /student/notifications/unread-count
 *
 * Returns: { unreadCount: number }
 */
export const fetchUnreadCount = async () => {
  return fetchWithRefresh('/student/notifications/unread-count');
};

/**
 * POST /student/notifications/:id/read
 * Marks a single notification as read.
 */
export const markNotificationRead = async (id) => {
  return fetchWithRefresh(`/student/notifications/${id}/read`, {
    method: 'POST',
  });
};

/**
 * POST /student/notifications/mark-read
 * Marks all notifications for the current student as read.
 */
export const markAllNotificationsRead = async () => {
  return fetchWithRefresh('/student/notifications/mark-read', {
    method: 'POST',
  });
};

export default {
  fetchDashboard,
  fetchApps,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
