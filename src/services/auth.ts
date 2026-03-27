import api from './api';

export const authService = {
  signup: async (data: any) => {
    const response = await api.post('/api/users/signup', data);
    return response.data;
  },
  login: async (data: any) => {
    const response = await api.post('/api/users/login', data);
    return response.data;
  }
};
