/**
 * API Configuration
 * Smart Classroom Mobile Usage Control System
 * Base URL and shared fetch utility for all API calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for Physical Android Device & Backend access:
export const BASE_URL = 'http://10.239.148.113:5000';

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

  const candidateBases = [
    BASE_URL,
    'http://localhost:5000',
    'http://10.0.2.2:5000',
    'http://127.0.0.1:5000',
  ];

  const fetchWithTimeout = (url, opts, timeoutMs = 3000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Network request timed out')), timeoutMs);
      fetch(url, opts)
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  let response = null;
  let lastError = null;

  for (const candidateBase of candidateBases) {
    try {
      response = await fetchWithTimeout(`${candidateBase}${path}`, {
        ...options,
        headers,
      }, 3500);
      if (response && response.status !== 503) {
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!response) {
    const err = new Error(
      lastError?.message || 'Unable to connect to server. Please verify backend server is running.',
    );
    err.status = 503;
    throw err;
  }

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
