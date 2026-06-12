export interface AdminUserDTO {
    id?: number;
    login: string;
    email: string;
    name: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone?: string | null;
    langKey?: string;
    roleId: number;
    roleName?: string;
    activated?: boolean;
    createdDate?: string;
}

export interface RoleOption {
    id: number;
    name: string;
}

// Map role name -> id depends on your seeded DB. Adjust if your role IDs differ.
export const ROLE_OPTIONS: RoleOption[] = [
    { id: 1, name: 'ROLE_ADMIN' },
    { id: 2, name: 'ROLE_MANAGER' },
    { id: 3, name: 'ROLE_STAFF' },
    { id: 4, name: 'ROLE_CUSTOMER' },
];

export const ROLE_LABELS: Record<string, string> = {
    ROLE_ADMIN: 'Admin',
    ROLE_MANAGER: 'Manager',
    ROLE_STAFF: 'Staff',
    ROLE_CUSTOMER: 'Customer',
};