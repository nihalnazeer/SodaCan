/* global axios */
const API_URL = 'http://localhost:8001/api';

const api = {
  async register(userData) {
    try {
      console.log('Registering user:', userData.email);
      const response = await axios.post(`${API_URL}/users/`, userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      throw error.response?.data?.detail || 'Registration failed';
    }
  },
  async login(credentials) {
    try {
      console.log('Logging in user:', credentials.email);
      const response = await axios.post(`${API_URL}/users/login`, credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error.response?.data?.detail || 'Login failed';
    }
  },
  async logout(token) {
    try {
      console.log('Logging out with token:', token.slice(0, 10) + '...');
      const response = await axios.post(`${API_URL}/users/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      throw error.response?.data?.detail || 'Logout failed';
    }
  },
  async getUserProfile(token) {
    try {
      console.log('Fetching user profile with token:', token.slice(0, 10) + '...');
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('User profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getUserProfile error:', error.response?.data || error.message);
      throw error.response?.data?.detail || 'Failed to fetch user profile';
    }
  },
  async viewRooms(token) {
    try {
      console.log('Fetching rooms with token:', token.slice(0, 10) + '...');
      const [publicRooms, privateRooms] = await Promise.all([
        axios.get(`${API_URL}/rooms/public`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/rooms/private`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const rooms = [
        ...publicRooms.data.map(room => ({ ...room, type: 'public' })),
        ...privateRooms.data.map(room => ({ ...room, type: 'private' })),
      ];
      console.log('Rooms fetched:', rooms);
      return { rooms };
    } catch (error) {
      console.error('viewRooms error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error.response?.data?.detail || 'Failed to fetch rooms';
    }
  },
  async createPublicRoom(token, roomData) {
    try {
      console.log('Creating public room:', roomData.name);
      const response = await axios.post(`${API_URL}/rooms/public`, roomData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { room: response.data };
    } catch (error) {
      console.error('createPublicRoom error:', error.response?.data || error.message);
      throw error.response?.data?.detail || 'Failed to create public room';
    }
  },
  async createPrivateRoom(token, roomData) {
    try {
      console.log('Creating private room:', roomData.name);
      const response = await axios.post(`${API_URL}/rooms/private`, roomData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { room: response.data };
    } catch (error) {
      console.error('createPrivateRoom error:', error.response?.data || error.message);
      throw error.response?.data?.detail || 'Failed to create private room';
    }
  },
  async joinPrivateRoom(token, roomToken) {
    try {
      console.log('Joining private room with token:', roomToken);
      const response = await axios.post(`${API_URL}/rooms/private/join`, { token: roomToken }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('joinPrivateRoom error:', error.response?.data || error.message);
      throw error.response?.data?.detail || 'Failed to join private room';
    }
  },
};

window.api = api;
export default api;