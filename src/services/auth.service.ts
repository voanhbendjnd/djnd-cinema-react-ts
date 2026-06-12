import axiosClient from './axiosClient';

export const authService = {
  login: async (data: any): Promise<ILoginRes> => {
    return axiosClient.post('/api/v1/auth/login', data);
  },

  register: async (data: any) => {
    return axiosClient.post('/api/v1/account/register', data);
  },

  activateAccount: async (key: string) => {
    return axiosClient.get(`/api/v1/account/activate?key=${key}`);
  },

  logout: async () => {
    return axiosClient.post('/api/v1/auth/logout');
  } ,

  hasValidToken(): boolean {
  const token = localStorage.getItem("access_token");
  return !!token;
}
};