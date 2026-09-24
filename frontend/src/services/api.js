import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true,
});

export const getCars = (page = 0, size = 30) =>
  api.get('/api/cars', { params: { page, size } }).then((res) => res.data);

export const searchCars = (q, page = 0, size = 30) =>
  api.get('/api/cars/search', { params: { q, page, size } }).then((res) => res.data);

export const getCar = (id) => api.get(`/api/cars/${id}`).then((res) => res.data);

export const getLeaderboard = (page = 0, size = 30) =>
  api.get('/api/leaderboard', { params: { page, size } }).then((res) => res.data);

export const getRanking = (carId) =>
  api.get(`/api/cars/${carId}/ranking`).then((res) => res.data);

export const getVoteStatus = (carId) =>
  api.get(`/api/cars/${carId}/vote-status`).then((res) => res.data);

export const voteForCar = (carId) =>
  api.post(`/api/cars/${carId}/vote`).then((res) => res.data);

export const getStats = () => api.get('/api/stats').then((res) => res.data);

export const getMe = () => api.get('/api/auth/me').then((res) => res.data);

export const logout = () => api.post('/api/auth/logout');

export const submitCarRequest = (payload) =>
  api.post('/api/car-requests', payload).then((res) => res.data);

export const getAdminStats = () => api.get('/api/admin/stats').then((res) => res.data);

export const getAdminCars = (page = 0, size = 25, q = '') =>
  api.get('/api/admin/cars', { params: { page, size, q: q || undefined } }).then((res) => res.data);

export const uploadAdminImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/admin/uploads', form).then((res) => res.data);
};

export const createAdminCar = (car) => api.post('/api/admin/cars', car).then((res) => res.data);

export const updateAdminCar = (id, car) => api.put(`/api/admin/cars/${id}`, car).then((res) => res.data);

export const deleteAdminCar = (id) => api.delete(`/api/admin/cars/${id}`);

export const getAdminCarRequests = (status = 'PENDING', page = 0, size = 25) =>
  api.get('/api/admin/car-requests', { params: { status, page, size } }).then((res) => res.data);

export const approveCarRequest = (id) => api.post(`/api/admin/car-requests/${id}/approve`).then((res) => res.data);

export const rejectCarRequest = (id) => api.post(`/api/admin/car-requests/${id}/reject`).then((res) => res.data);

export const googleLoginUrl = `${api.defaults.baseURL}/oauth2/authorization/google`;

export default api;
