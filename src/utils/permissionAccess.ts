import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/store/useAuthStore';
import type { PermissionMethod } from '@/types/permission.types';

interface PermissionTokenPayload {
  permission?: string[];
  authorities?: string[];
}

const normalizePermission = (apiPath: string, method: PermissionMethod | string) => {
  return `${apiPath.trim().toLowerCase()}:${method.trim().toUpperCase()}`;
};

export const getCurrentPermissionStrings = (): string[] => {
  const token = useAuthStore.getState().accessToken;

  if (!token) {
    return [];
  }

  try {
    const payload = jwtDecode<PermissionTokenPayload>(token);
    return [...(payload.permission || []), ...(payload.authorities || [])];
  } catch {
    return [];
  }
};

export const hasPermission = (apiPath: string, method: PermissionMethod | string): boolean => {
  const { role } = useAuthStore.getState();
  const permissions = getCurrentPermissionStrings();

  if (role === 'ROLE_ADMIN' || permissions.includes('ROLE_ADMIN')) {
    return true;
  }

  const requiredPermission = normalizePermission(apiPath, method);

  return permissions.some((permission) => {
    if (!permission.includes(':')) {
      return false;
    }

    const [permissionPath, permissionMethod] = permission.split(':');
    return normalizePermission(permissionPath, permissionMethod) === requiredPermission;
  });
};
