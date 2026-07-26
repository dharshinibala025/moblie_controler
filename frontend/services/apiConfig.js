/**
 * API Configuration
 * Smart Classroom Mobile Usage Control System
 * Base URL and shared fetch utility for all API calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Base URL ────────────────────────────────────────────────────────────────
// Change this to your production server URL when deploying.
// For Android emulator: 10.0.2.2:5000
// For real device on same network: your machine's LAN IP
export const BASE_URL = 'http://10.0.2.2:5000';

// ─── Storage Keys ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@focussync:accessToken',
  REFRESH_TOKEN: '@focussync:refreshToken',
  USER: '@focussync:user',
};

// ─── Token Helpers ────────────────────────────────────────────────────────────
export const getAccessToken = async () => {
  return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = async () => {
  return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const saveTokens = async (accessToken, refreshToken) => {
  const tasks = [AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)];
  if (refreshToken) {
    tasks.push(AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken));
  }
  await Promise.all(tasks);
};

export const clearTokens = async () => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.USER),
  ]);
};

export const saveUser = async (user) => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getStoredUser = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

// ─── Core Fetch Utility ───────────────────────────────────────────────────────
/**
 * apiFetch — wraps fetch with:
 *  - automatic Authorization header injection
 *  - JSON parsing
 *  - structured error objects { error, status }
 *
 * Does NOT auto-refresh tokens — that logic lives in authService.
 */
export const apiFetch = async (path, options = {}) => {
  const token = await getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const err = new Error(data?.error || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

export default apiFetch;
