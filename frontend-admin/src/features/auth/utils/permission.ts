export const normalizePermission = (permission?: string | null): string => {
    if (!permission) return "";
    return permission.trim().toUpperCase();
};

export const normalizePermissions = (permissions?: string[] | null): string[] => {
    if (!permissions) return [];
    return permissions
        .map((permission) => normalizePermission(permission))
        .filter(Boolean);
};
