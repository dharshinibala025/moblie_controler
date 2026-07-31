/**
 * authService — Frontend Authentication Service
 * Smart Classroom Mobile Usage Control System
 *
 * Handles: login, logout, session restore, token refresh,
 *          password change (first-time), health check.
 *
 * All token persistence is via AsyncStorage.
 * All API calls go through apiFetch (apiConfig.js).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  STORAGE_KEYS,
  apiFetch,
  saveTokens,
  saveUser,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  clearTokens,
} from './apiConfig';

class AuthService {
  // ─── Health Check ─────────────────────────────────────────────────────────
  /**
   * GET /health — checks if the backend is reachable.
   * Returns true if healthy, false otherwise.
   */
  async healthCheck() {
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data?.status === 'ok';
    } catch {
      return false;
    }
  }

  // ─── Session Restore ──────────────────────────────────────────────────────
  /**
   * Restores a previous session from AsyncStorage.
   * Returns { token, user } or null.
   */
  async getSession() {
    try {
      const [token, user] = await Promise.all([
        getAccessToken(),
        getStoredUser(),
      ]);
      if (token && user) {
        return { token, user };
      }
      return null;
    } catch {
      return null;
    }
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  /**
   * POST /auth/login
   * Returns:
   *  - { screen: 'passwordReset', mustChangePassword: true, accessToken, user } for first-time
   *  - { screen: 'dashboard', user } on success
   *  - throws Error on failure
   */
  async login(email, password, role = 'student') {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password, role }),
    });

    // First-time password change required
    if (data.mustChangePassword) {
      const tokenToUse = data.tempToken || data.accessToken;
      return {
        screen: 'passwordReset',
        mustChangePassword: true,
        accessToken: tokenToUse,
        tempToken: tokenToUse,
        preToken: tokenToUse,
        user: data.user,
      };
    }

    // Normal login — persist tokens and user
    await Promise.all([
      saveTokens(data.accessToken, data.refreshToken),
      saveUser(data.user),
    ]);

    return {
      screen: 'dashboard',
      user: data.user,
    };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────
  /**
   * POST /auth/logout — revokes refresh token, clears local storage.
   */
  async logout() {
    try {
      const refreshToken = await getRefreshToken();
      const accessToken = await getAccessToken();

      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Silently fail — we still clear local storage
    } finally {
      await clearTokens();
    }
  }

  // ─── Token Refresh ─────────────────────────────────────────────────────────
  /**
   * POST /auth/refresh — exchanges refresh token for new access token.
   * Returns new accessToken string or null.
   */
  async refreshAccessToken() {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.accessToken) {
        return null;
      }

      await saveTokens(data.accessToken, data.refreshToken || refreshToken);
      return data.accessToken;
    } catch {
      return null;
    }
  }

  // ─── Change Password (First-Time) ─────────────────────────────────────────
  /**
   * POST /auth/change-password
   * Used when mustChangePassword = true (temp token flow).
   * On success, saves the real session and returns the user.
   */
  async changePasswordWithTempToken(tempToken, newPassword) {
    const response = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, newPassword }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const err = new Error(data?.error || 'Password change failed');
      err.status = response.status;
      throw err;
    }

    // Persist the real session after password change
    if (data.accessToken) {
      await Promise.all([
        saveTokens(data.accessToken, data.refreshToken),
        saveUser(data.user),
      ]);
    }

    return data;
  }
}

export default new AuthService();
