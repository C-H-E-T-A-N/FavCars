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

export const googleLoginUrl = `${api.defaults.baseURL}/oauth2/authorization/google`;

export default api;
