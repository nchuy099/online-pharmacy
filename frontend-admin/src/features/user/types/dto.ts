import { Pagination } from "../../../shared/types";
import { User } from "./domain";

export interface UserListResponse {
    users: User[];
    pagination: Pagination;
}

export interface AdminCreateUserReq {
    email: string;
    fullName: string;
    password: string;
    roleName?: string;
    biography?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
}

export interface AdminUpdateUserReq {
    email?: string;
    fullName?: string;
    biography?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
}

export interface AdminChangePasswordReq {
    newPassword?: string;
}

export interface AdminChangeRoleReq {
    roleName?: string;
}

export interface AdminChangeStatusReq {
    status?: string;
}

export interface AddressResponse {
    id: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    provinceName: string;
    districtName: string;
    wardName: string;
    isDefault: boolean;
}

export interface AddressListResponse {
    addresses: AddressResponse[];
    pagination: Pagination;
}
