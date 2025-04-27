import axios from 'axios';

const API_URL = 'http://localhost:8001/api'; // Base URL with /api prefix

export const api = {
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/users/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Registration failed';
    }
  },
  async login(credentials) {
    try {
      const response = await axios.post(`${API_URL}/users/login`, credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Login failed';
    }
  },
  async logout(token) {
    try {
      const response = await axios.post(`${API_URL}/users/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Logout failed';
    }
  },
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh?refresh_token=${refreshToken}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Token refresh failed';
    }
  },
};