import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

const sessionService = {
  saveSession: async (token, user) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  },

  getSession: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (err) {
      return null;
    }
  },

  getUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      return null;
    }
  },

  clearSession: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  },

  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return !!token;
    } catch (err) {
      return false;
    }
  },
};

export default sessionService;
