import axios from 'axios';

const API = axios.create({ 
  baseURL: 'https://team-task-manager-production-37eb.up.railway.app/api' 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;