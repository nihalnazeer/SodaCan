import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8001/api', // Updated to port 8000
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      localStorage.removeItem('coins');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = {
  // Auth endpoints
  login: (data) => apiClient.post('/users/login', data).then((res) => res.data),
  register: (data) => apiClient.post('/users/register', data).then((res) => res.data),
  getUserProfile: () => apiClient.get('/users/me').then((res) => res.data),
  logout: () => apiClient.post('/users/logout').then((res) => res.data),

  // Room endpoints
  createPublicRoom: (data) => apiClient.post('/rooms/public', data).then((res) => res.data),
  createPrivateRoom: (data) => apiClient.post('/rooms/private', data).then((res) => res.data),

  // Room joining endpoints
  joinPublicRoom: (roomId) => apiClient.post(`/rooms/public/join/${roomId}`).then((res) => res.data),
  joinPrivateRoom: (roomToken) => apiClient.post('/rooms/private/join', { token: roomToken }).then((res) => res.data),

  // Room viewing endpoints
  getPublicRooms: () => apiClient.get('/rooms/public').then((res) => res.data),
  getPrivateRooms: () => apiClient.get('/rooms/private').then((res) => res.data),
  getAllRooms: () => apiClient.get('/rooms').then((res) => res.data),

  // Message endpoints
  sendMessage: (data) => apiClient.post('/messages', data).then((res) => res.data),
  getRoomMessages: (roomId) => apiClient.get(`/messages/room/${roomId}`).then((res) => res.data),

  // Room management endpoints
  deletePublicRoom: (roomId) => apiClient.delete(`/rooms/public/${roomId}`).then((res) => res.data),
  deletePrivateRoom: (roomToken) => apiClient.delete(`/rooms/private/${roomToken}`).then((res) => res.data),

  // Search endpoint
  searchPrivateRoom: (token) => apiClient.get(`/rooms/search/${token}`).then((res) => res.data),
};

export default api;