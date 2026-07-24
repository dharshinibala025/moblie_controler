import api from './api';
import sessionService from './sessionService';

const base64Decode = (str) => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    str = String(str).replace(/=+$/, '');
    for (let bc = 0, bs, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  } catch (e) {
    return null;
  }
};

let _preToken = null;

const authService = {
  login: async (email, password, role) => {
    try {
      const data = await api.post('/auth/login', { email, password, role });

      if (data.token) {
        const userData = authService.parseToken(data.token);
        await sessionService.saveSession(data.token, userData);
        return { success: true, token: data.token, user: userData };
      }
      return { success: true, ...data };
    } catch (error) {
      if (error.status === 403) {
        const details = error.details || {};
        if (details.mustChangePassword) {
          _preToken = details.preToken;
          return { success: false, mustChangePassword: true, preToken: _preToken, userId: details.userId, role: details.role };
        }
        if (details.requiresConsent) {
          _preToken = details.preToken;
          return { success: false, requiresConsent: true, preToken: _preToken, userId: details.userId, role: details.role };
        }
        if (error.message && error.message.includes('not activated')) {
          return { success: false, needsActivation: true, error: error.message };
        }
      }
      throw error;
    }
  },

  checkActivation: async (email) => {
    const data = await api.post('/auth/check-activation', { email });
    return data;
  },

  activateAccount: async (email, activationCode, newPassword) => {
    const data = await api.post('/auth/activate', { email, activationCode, newPassword });
    if (data.token) {
      const userData = authService.parseToken(data.token);
      await sessionService.saveSession(data.token, userData);
    }
    return data;
  },

  acceptConsent: async (consentVersion, preToken) => {
    const data = await api.post('/auth/consent/accept', {
      consentVersion: consentVersion || '1.0',
      preToken: preToken || _preToken,
    });
    if (data.token) {
      const userData = authService.parseToken(data.token);
      await sessionService.saveSession(data.token, userData);
      _preToken = null;
    }
    return data;
  },

  changePassword: async (currentPassword, newPassword, preToken) => {
    const body = { currentPassword, newPassword };
    if (preToken) body.preToken = preToken;
    const data = await api.post('/auth/change-password', body);
    if (data.token) {
      const userData = authService.parseToken(data.token);
      await sessionService.saveSession(data.token, userData);
      _preToken = null;
    }
    return data;
  },

  logout: async () => {
    await sessionService.clearSession();
    _preToken = null;
  },

  isLoggedIn: async () => {
    return await sessionService.isLoggedIn();
  },

  getSession: async () => {
    return await sessionService.getSession();
  },

  healthCheck: async () => {
    return await api.healthCheck();
  },

  setPreToken: (token) => {
    _preToken = token;
  },

  getPreToken: () => {
    return _preToken;
  },

  parseToken: (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = base64Decode(base64);
      if (!decoded) return null;
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  },

  getErrorMessage: (error) => {
    if (!error) return 'An unexpected error occurred. Please try again.';
    const message = error.message || error.error || '';
    switch (error.status) {
      case 401: return 'Invalid email or password';
      case 403:
        if (message.includes('suspended')) return 'Account suspended. Contact your administrator.';
        if (message.includes('insufficient')) return 'Access denied: insufficient permissions';
        return message;
      case 423: return message || 'Account locked. Please try again later.';
      case 429: return 'Too many login attempts. Please try again later.';
      default: return message || 'Login failed. Please check your credentials.';
    }
  },
};

export default authService;
