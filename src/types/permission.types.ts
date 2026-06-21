export type PermissionMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface PermissionDTO {
  id?: number;
  name: string;
  apiPath: string;
  method: PermissionMethod;
  module: string;
}

export interface PermissionFilters {
  name?: string;
  apiPath?: string;
  method?: PermissionMethod;
  module?: string;
}

export interface PermissionPageable {
  current: number;
  pageSize: number;
  total: number;
}

export const PERMISSION_METHODS: PermissionMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

export const PERMISSION_API_PATHS = {
  list: '/api/v1/admin/permissions',
  create: '/api/v1/admin/permissions',
  update: '/api/v1/admin/permissions',
  delete: '/api/v1/admin/permissions/{id}',
};
