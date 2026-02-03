import { normalizePermissions } from "./permission";

export const ADMIN_ACCESS_PERMISSIONS = [
    "READ_ANALYTICS",
    "CREATE_CATEGORY",
    "DELETE_CATEGORY",
    "READ_CATEGORY",
    "UPDATE_CATEGORY",
    "IMPORT_INVENTORY",
    "READ_INVENTORY",
    "CONFIRM_ORDER",
    "READ_ORDER",
    "SHIP_ORDER",
    "READ_PAYMENT",
    "CREATE_PRODUCT",
    "DELETE_PRODUCT",
    "UPLOAD_PRODUCT_IMAGE",
    "READ_PRODUCT",
    "UPDATE_PRODUCT",
    "MANAGE_RBAC",
    "READ_RBAC",
    "ACCESS_PHARMACIST_APP",
    "MANAGE_PHARMACIST_CHAT",
    "READ_PHARMACIST_CONSULTATION",
    "READ_PHARMACIST_PATIENT_HISTORY",
    "READ_PHARMACIST_PROFILE",
    "UPDATE_PHARMACIST_PROFILE",
    "MANAGE_PHARMACIST_PRESCRIPTION",
    "CREATE_USER",
    "RESET_USER_PASSWORD",
    "READ_USER",
    "ASSIGN_USER_ROLE",
    "UPDATE_USER_STATUS",
    "UPDATE_USER",
];

export const PHARMACIST_ACCESS_PERMISSIONS = [
    "ACCESS_PHARMACIST_APP",
    "MANAGE_PHARMACIST_CHAT",
    "READ_PHARMACIST_CONSULTATION",
    "READ_PHARMACIST_PATIENT_HISTORY",
    "READ_PHARMACIST_PROFILE",
    "UPDATE_PHARMACIST_PROFILE",
    "MANAGE_PHARMACIST_PRESCRIPTION",
];

export const hasAnyPermission = (permissions: string[] | null | undefined, requiredPermissions: string[]) => {
    const currentPermissions = normalizePermissions(permissions);
    return requiredPermissions.some((permission) => currentPermissions.includes(permission));
};

export const canEnterAdmin = (permissions: string[] | null | undefined) => hasAnyPermission(permissions, ADMIN_ACCESS_PERMISSIONS);

