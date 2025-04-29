import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    if (error.response?.status === 401) {
      console.log('401 detected, clearing tokens and redirecting to /login');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      localStorage.removeItem('coins');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = {
  login: (data) => apiClient.post('/users/login', data).then((res) => res.data),
  register: (data) => apiClient.post('/users/', data).then((res) => res.data),
  getUserProfile: () => apiClient.get('/users/me').then((res) => res.data),
  logout: () => apiClient.post('/users/logout').then((res) => res.data),
  createPublicRoom: (data) => apiClient.post('/rooms/public', data).then((res) => res.data),
  createPrivateRoom: (data) => apiClient.post('/rooms/private', data).then((res) => res.data),
  joinPublicRoom: (roomId) => apiClient.post(`/rooms/public/join/${roomId}`).then((res) => res.data),
  joinPrivateRoom: (roomToken) => apiClient.post('/rooms/private/join', { token: roomToken }).then((res) => res.data),
  getPublicRooms: () => apiClient.get('/rooms/public/view').then((res) => res.data),
  getPrivateRooms: () => apiClient.get('/rooms/private').then((res) => res.data),
  getAllRooms: () => apiClient.get('/rooms').then((res) => res.data),
  sendMessage: (data) => apiClient.post('/messages', data).then((res) => res.data),
  getRoomMessages: (roomId) => apiClient.get(`/messages/room/${roomId}`).then((res) => res.data),
  deletePublicRoom: (roomId) => apiClient.delete(`/rooms/public/${roomId}`).then((res) => res.data),
  deletePrivateRoom: (roomToken) => apiClient.delete(`/rooms/private/${roomToken}`).then((res) => res.data),
  searchPrivateRoom: (token) => apiClient.get(`/rooms/search/${token}`).then((res) => res.data),
  getRoomMembers: (roomId) => apiClient.get(`/rooms/room/${roomId}/members`).then((res) => res.data),
};

export default api;