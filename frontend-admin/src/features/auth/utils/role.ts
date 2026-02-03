export const normalizeRole = (role?: string | null): string => {
    if (!role) return "";
    const trimmed = role.trim().toUpperCase();
    return trimmed.startsWith("ROLE_") ? trimmed.slice(5) : trimmed;
};

