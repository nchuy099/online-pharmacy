import axios from "../../shared/services/axios";
import { ApiResponse } from "../../shared/types";
import {
    CreateRolePayload,
    CurrentAccess,
    Permission,
    RoleOption,
    RolePermission,
    RoleSummary,
    UpdateRolePayload,
    UpdateRolePermissionsPayload,
} from "./types";

const rbacApi = {
    async getCurrentAccess(): Promise<ApiResponse<CurrentAccess>> {
        const res = await axios.get("/admin/roles/me");
        return res.data;
    },

    async getRoles(): Promise<ApiResponse<RolePermission[]>> {
        const res = await axios.get("/admin/roles");
        return res.data;
    },

    async getRoleSummaries(): Promise<ApiResponse<RoleSummary[]>> {
        const res = await axios.get("/admin/roles/summary");
        return res.data;
    },

    async getAdminRoleSummaries(): Promise<ApiResponse<RoleSummary[]>> {
        const res = await axios.get("/admin/roles/admin/summary");
        return res.data;
    },

    async getRoleOptions(): Promise<ApiResponse<RoleOption[]>> {
        const res = await axios.get("/admin/roles/options");
        return res.data;
    },

    async getAdminRoleOptions(): Promise<ApiResponse<RoleOption[]>> {
        const res = await axios.get("/admin/roles/admin/options");
        return res.data;
    },

    async getRole(roleId: string): Promise<ApiResponse<RolePermission>> {
        const res = await axios.get(`/admin/roles/${roleId}`);
        return res.data;
    },

    async getPermissions(): Promise<ApiResponse<Permission[]>> {
        const res = await axios.get("/admin/permissions");
        return res.data;
    },

    async createRole(payload: CreateRolePayload): Promise<ApiResponse<RolePermission>> {
        const res = await axios.post("/admin/roles/create", payload);
        return res.data;
    },

    async updateRole(roleId: string, payload: UpdateRolePayload): Promise<ApiResponse<RolePermission>> {
        const res = await axios.put(`/admin/roles/${roleId}/update`, payload);
        return res.data;
    },

    async deleteRole(roleId: string): Promise<ApiResponse<null>> {
        const res = await axios.delete(`/admin/roles/${roleId}/delete`);
        return res.data;
    },

    async updateRolePermissions(roleId: string, payload: UpdateRolePermissionsPayload): Promise<ApiResponse<RolePermission>> {
        const res = await axios.put(`/admin/roles/${roleId}/permissions`, payload);
        return res.data;
    },
};

export default rbacApi;
