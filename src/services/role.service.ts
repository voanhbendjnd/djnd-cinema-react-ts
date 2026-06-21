import axiosClient from '@/services/axiosClient';

export interface RoleUserDTO {
    id: number;
    name: string;
}

export interface IPermission {
    id: number;
    name: string;
    apiPath: string;
    method: string;
    module: string;
}

export interface IRole {
    id?: number;
    name: string;
    description: string;
    permissions: IPermission[] | { id: number }[];
    createdDate?: string;
}

export const roleService = {
    getAllRoles: async (): Promise<RoleUserDTO[]> => {
        return axiosClient.get("/api/v1/admin/roles/user");
    },

    getRoles: async (params: { page: number; size: number; q?: string }): Promise<IBackendRes<{
        meta: {
            page: number;
            pageSize: number;
            pages: number;
            total: number;
        };
        result: IRole[];
    }>> => {
        const page = params.page - 1; // Spring Boot page index is 0-based
        const size = params.size;
        const searchParams = new URLSearchParams();
        searchParams.append('page', page.toString());
        searchParams.append('size', size.toString());
        if (params.q) {
            searchParams.append('q', params.q);
        }
        return axiosClient.get(`/api/v1/admin/roles?${searchParams.toString()}&sort=lastModifiedDate,desc`);
    },

    createRole: async (role: IRole): Promise<IBackendRes<IRole>> => {
        return axiosClient.post('/api/v1/admin/roles', role);
    },

    updateRole: async (role: IRole): Promise<IBackendRes<IRole>> => {
        return axiosClient.put('/api/v1/admin/roles', role);
    },

    deleteRole: async (id: number): Promise<IBackendRes<void>> => {
        return axiosClient.delete(`/api/v1/admin/roles/${id}`);
    },

    getPermissions: async (params: { page: number; size: number; q?: string }): Promise<IBackendRes<{
        meta: {
            page: number;
            pageSize: number;
            pages: number;
            total: number;
        };
        result: IPermission[];
    }>> => {
        const page = params.page - 1; // Spring Boot page index is 0-based
        const size = params.size;
        const searchParams = new URLSearchParams();
        searchParams.append('page', page.toString());
        searchParams.append('size', size.toString());
        if (params.q) {
            searchParams.append('q', params.q);
        }
        return axiosClient.get(`/api/v1/admin/permissions?${searchParams.toString()}`);
    }
};
