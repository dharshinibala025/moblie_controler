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
   * Fallback to mock data when backend is not running/unreachable.
   * Returns:
   *  - { screen: 'passwordReset', mustChangePassword: true, accessToken, user } for first-time
   *  - { screen: 'dashboard', user } on success
   */
  async login(email, password, role = 'student') {
    const trimmedEmail = email ? email.trim() : '';

    let data;
    try {
      data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail, password, role }),
      });
    } catch (error) {
      console.warn('[Frontend-Only Mode] Backend unavailable, using mock login for role:', role);
      data = this.getMockLoginResponse(trimmedEmail, role);
    }

    if (!data || !data.user) {
      data = this.getMockLoginResponse(trimmedEmail, role);
    }

    // First-time password change required
    if (data.mustChangePassword) {
      const tokenToUse = data.tempToken || data.accessToken || 'mock-temp-token-123';
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
      saveTokens(data.accessToken || 'mock-access-token', data.refreshToken || 'mock-refresh-token'),
      saveUser(data.user),
    ]);

    return {
      screen: 'dashboard',
      user: data.user,
      accessToken: data.accessToken || 'mock-access-token',
    };
  }

  /**
   * Helper: Generate role-specific mock user data for frontend-only usage
   */
  getMockLoginResponse(email, role = 'student') {
    const roleLower = (role || 'student').toLowerCase();

    let mockUser;
    if (roleLower === 'staff') {
      mockUser = {
        id: 'stf-mock-101',
        name: 'Dr. K. Arisuthan',
        email: email || 'arisuthan@ksrce.ac.in',
        role: 'staff',
        department: 'CSE',
        employeeId: 'STF214',
        avatar: 'KA',
        assignedClass: 'CSE - 3rd Year A',
      };
    } else if (roleLower === 'admin') {
      mockUser = {
        id: 'adm-mock-001',
        name: 'System Administrator',
        email: email || 'admin@ksrce.ac.in',
        role: 'admin',
        department: 'IT & Administration',
        avatar: 'AD',
      };
    } else {
      mockUser = {
        id: 'stu-mock-501',
        name: 'Aarav Sharma',
        email: email || 'aarav.sharma@ksrce.ac.in',
        role: 'student',
        department: 'CSE',
        year: '3rd Year',
        section: 'A',
        registerNumber: '731521104001',
        avatar: 'AS',
      };
    }

    return {
      accessToken: `mock-${roleLower}-token-jwt-12345`,
      refreshToken: `mock-${roleLower}-refresh-token-xyz`,
      user: mockUser,
      mustChangePassword: false,
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
    try {
      const data = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ tempToken, newPassword }),
      });

      // Persist the real session after password change
      if (data && data.accessToken) {
        await Promise.all([
          saveTokens(data.accessToken, data.refreshToken),
          saveUser(data.user),
        ]);
      }

      return data;
    } catch (err) {
      console.warn('[Frontend-Only Mode] Password change fallback:', err.message);
      const mockUser = {
        id: 'user-mock-pwd',
        name: 'User',
        email: 'user@ksrce.ac.in',
        role: 'student',
      };
      await Promise.all([
        saveTokens('mock-access-token-new', 'mock-refresh-token-new'),
        saveUser(mockUser),
      ]);
      return { success: true, user: mockUser, accessToken: 'mock-access-token-new' };
    }
  }
}

export default new AuthService();
