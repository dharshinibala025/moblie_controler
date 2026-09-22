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

import {
  apiFetch,
  refreshAccessToken,
} from './apiConfig';

// ─── Auto-refresh wrapper ─────────────────────────────────────────────────────
/**
 * Calls apiFetch; on 401 tokenExpired, refreshes the access token and retries once.
 * Refresh is single-flight (shared in apiConfig) so concurrent 401s never race.
 */
const fetchWithRefresh = async (path, options = {}) => {
  try {
    return await apiFetch(path, options);
  } catch (err) {
    if (err.status === 401 && err.data?.tokenExpired) {
      try {
        const newToken = await refreshAccessToken();
        return await apiFetch(path, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch {
        throw err;
      }
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
