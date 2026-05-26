import api from './api';

export const authService = {
  signup: async (data: any) => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },
  login: async (data: any) => {
    const response = await api.post('/api/auth/login', data);
    console.log("login res from service", response);

    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
  logoutAll: async () => {
    const response = await api.post('/api/auth/logout-all');
    return response.data;
  },
  refresh: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};
