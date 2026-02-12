export interface Permission {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    critical?: boolean;
    assignable?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleSummary {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    protectedRole?: boolean;
    permissionCount?: number;
    userCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleOption {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    protectedRole?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RolePermission {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    protectedRole?: boolean;
    userCount?: number;
    permissions: Permission[];
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateRolePermissionsPayload {
    permissionNames: string[];
}

export interface CreateRolePayload {
    name: string;
    description?: string;
    roleType: string;
}

export interface UpdateRolePayload {
    name: string;
    description?: string;
}

export interface CurrentAccess {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    protectedRole?: boolean;
    permissions: Permission[];
}
