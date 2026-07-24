import sessionService from './sessionService';

const API_BASE_URL = 'http://10.0.2.2:5000';

const api = {
  getToken: async () => {
    return await sessionService.getToken();
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

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
