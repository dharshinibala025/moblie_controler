import sessionService from './sessionService';

const CANDIDATE_HOSTS = ['http://10.0.2.2:5000', 'http://127.0.0.1:5000', 'http://localhost:5000'];
let activeBaseUrl = 'http://10.0.2.2:5000';

const api = {
  getToken: async () => {
    return await sessionService.getToken();
  },

  healthCheck: async () => {
    for (const host of CANDIDATE_HOSTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${host}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          activeBaseUrl = host;
          return true;
        }
      } catch (e) {
        // try next candidate host
      }
    }
    return false;
  },

  request: async (endpoint, options = {}) => {
    const token = await api.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${activeBaseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkError) {
      // Retry via candidates if active URL failed
      const healthy = await api.healthCheck();
      if (healthy) {
        response = await fetch(`${activeBaseUrl}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        throw { status: 0, message: 'Backend server is unavailable. Please check server connection.' };
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const error = { status: response.status, message: data.error || 'Request failed', details: data };

      if (data.sessionInvalidated) {
        await sessionService.clearSession();
        error.sessionInvalidated = true;
      }

      throw error;
    }

    return data;
  },

  get: (endpoint) => api.request(endpoint, { method: 'GET' }),
  post: (endpoint, body) =>
    api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) =>
    api.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => api.request(endpoint, { method: 'DELETE' }),
};

export default api;
