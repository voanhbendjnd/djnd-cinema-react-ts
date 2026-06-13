import axiosClient from './axiosClient';

export interface RoleUserDTO {
    id: number;
    name: string;
}

export const roleService = {
    getAllRoles: async (): Promise<RoleUserDTO[]> => {
       return  axiosClient.get("/api/v1/admin/roles/user");
    },
};


