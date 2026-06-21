import axiosClient from '@/services/axiosClient';
import type { PermissionDTO } from '@/types/permission.types';

interface PermissionListParams {
  current?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
}

export const permissionService = {
  getPermissions: async (
    params: PermissionListParams
  ): Promise<IBackendRes<IModelPaginate<PermissionDTO>>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', String(params.current || 1));
    searchParams.append('size', String(params.pageSize || 10));

    if (params.sort) {
      searchParams.append('sort', params.sort);
    }

    if (params.q) {
      searchParams.append('q', params.q);
    }

    const response = await axiosClient.get(`/api/v1/admin/permissions?${searchParams.toString()}&sort=lastModifiedDate,desc`);
    return response as unknown as IBackendRes<IModelPaginate<PermissionDTO>>;
  },

  createPermission: async (payload: PermissionDTO): Promise<IBackendRes<PermissionDTO>> => {
    const response = await axiosClient.post('/api/v1/admin/permissions', payload);
    return response as unknown as IBackendRes<PermissionDTO>;
  },

  updatePermission: async (payload: PermissionDTO): Promise<IBackendRes<PermissionDTO>> => {
    const response = await axiosClient.put('/api/v1/admin/permissions', payload);
    return response as unknown as IBackendRes<PermissionDTO>;
  },

  deletePermission: async (id: number): Promise<IBackendRes<null>> => {
    const response = await axiosClient.delete(`/api/v1/admin/permissions/${id}`);
    return response as unknown as IBackendRes<null>;
  },
};
