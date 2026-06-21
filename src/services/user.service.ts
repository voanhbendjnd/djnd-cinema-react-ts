import axiosClient from '@/services/axiosClient';
import type {AdminUserDTO} from "@/types/user.types.ts";

export const userService = {
  getEmployees: async (params: { current?: number; pageSize?: number; q?: string }): Promise<IBackendRes<IModelPaginate<IAccount>>> => {
    const page = params.current ? params.current - 1 : 0; // Spring boot page is 0-indexed
    const size = params.pageSize || 10;
    
    // Ant Design ProTable pass params.current and params.pageSize
    const searchParams = new URLSearchParams();
    searchParams.append('page', page.toString());
    searchParams.append('size', size.toString());
    
    if (params.q) {
      searchParams.append('q', params.q);
    }

    return axiosClient.get(`/api/v1/admin/users/employee?${searchParams.toString()}&sort=lastModifiedDate,desc`);
  },
  getCustomers: async (params: { current?: number; pageSize?: number; q?: string }): Promise<IBackendRes<IModelPaginate<IAccount>>> => {
    const page = params.current ? params.current - 1 : 0; // Spring boot page is 0-indexed
    const size = params.pageSize || 10;

    // Ant Design ProTable pass params.current and params.pageSize
    const searchParams = new URLSearchParams();
    searchParams.append('page', page.toString());
    searchParams.append('size', size.toString());

    if (params.q) {
      searchParams.append('q', params.q);
    }

    return axiosClient.get(`/api/v1/admin/users/customer?${searchParams.toString()}&sort=lastModifiedDate,desc`);
  },
  createUser: async (data: any) => {
    return axiosClient.post('/api/v1/admin/users', data);
  },
  updateUser: async (data: any) => {
    return axiosClient.put('/api/v1/admin/users', data);
  },
  deleteUser: async (login: string) => {
    return axiosClient.delete(`/api/v1/admin/users/${login}`);
  },

  toggleStatus: async (id: number, activated: boolean) => {
    return axiosClient.patch('/api/v1/admin/users/activated', {
      id,
      activated,
    });
  },
};

export const adminUserService = {
  createUserAdmin: (payload: AdminUserDTO) => {
    return axiosClient.post<AdminUserDTO>('/api/v1/admin/users', payload);
  },

  // Optional helpers if you build a role select that fetches from backend
  getRoles: () => {
    return axiosClient.get('/api/v1/admin/roles');
  },
};
