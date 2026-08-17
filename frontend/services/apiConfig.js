/**
 * API Configuration
 * Smart Classroom Mobile Usage Control System
 * Base URL and shared fetch utility for all API calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Cloud Production URL (Render) ───────────────────────────────────────────
// This is the primary URL used by the production release APK.
// For local development with emulator, change this to 'http://10.0.2.2:5000'
export const BASE_URL = 'https://moblie-controler.onrender.com';




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
let cachedWorkingBaseUrl = null;

export const apiFetch = async (path, options = {}) => {
  const token = await getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const timeoutMs = options.timeout || 90000;

  const fetchWithTimeout = (url, opts, limitMs) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Network request timed out')), limitMs);
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

  const candidateBases = Array.from(
    new Set([
      ...(cachedWorkingBaseUrl ? [cachedWorkingBaseUrl] : []),
      BASE_URL,
    ]),
  );

  let response = null;
  let lastError = null;

  for (let i = 0; i < candidateBases.length; i++) {
    const candidateBase = candidateBases[i];

    try {
      response = await fetchWithTimeout(
        `${candidateBase}${path}`,
        {
          ...options,
          headers,
        },
        timeoutMs,
      );

      if (response && response.status !== 503) {
        cachedWorkingBaseUrl = candidateBase;
        break;
      }
    } catch (err) {
      lastError = err;
      if (candidateBase === cachedWorkingBaseUrl) {
        cachedWorkingBaseUrl = null; // Invalidate cached URL if it fails
      }
    }
  }

  if (!response) {
    const err = new Error(
      'Cloud Server Connection Failed. Please check your internet connection or try again in a few seconds while the server wakes up.',
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
