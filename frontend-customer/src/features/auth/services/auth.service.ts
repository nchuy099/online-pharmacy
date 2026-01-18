import { authApi } from "../api/auth.api";
import type {
    LoginRequestDTO,
    SignUpRequestDTO,
    RefreshTokenRequestDTO,
    UserDTO
} from "../types/dto";
import type { User } from "../types/domain";
import type { CurrentRoleDTO } from "../types/dto";
import { isUserLockedApiError } from "../../shared/api/error";
import { AUTH_USER_LOCKED_EVENT } from "../auth.constants";

const emitUserLocked = () => {
    window.dispatchEvent(new Event(AUTH_USER_LOCKED_EVENT));
};

export const CUSTOMER_LOGIN_ERROR_MESSAGE =
    "Tài khoản này không có quyền đăng nhập vào ứng dụng khách hàng.";

const normalizeRoleType = (value?: string | null) => value?.trim().toUpperCase();

const assertCustomerRole = (role: CurrentRoleDTO): string => {
    const roleType = normalizeRoleType(role.roleType);
    if (roleType !== "CUSTOMER") {
        throw new Error(CUSTOMER_LOGIN_ERROR_MESSAGE);
    }
    return roleType;
};

const applyCurrentRole = async (user: User): Promise<User> => {
    try {
        const roleType = assertCustomerRole(await authApi.getCurrentRole());
        return {
            ...user,
            role: roleType,
            roleType,
        };
    } catch (error) {
        console.warn("Failed to load current role", error);
        if (isUserLockedApiError(error)) {
            emitUserLocked();
        }
        throw error;
    }
};

const mapUserDTOToDomain = (dto: UserDTO): User => ({
    id: dto.id,
    email: dto.email,
    fullName: dto.fullName
});

export const authService = {
    login: async (data: LoginRequestDTO) => {
        const res = await authApi.login(data);
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);

        try {
            const hydratedUser = await applyCurrentRole({
                ...mapUserDTOToDomain(res.user),
            });

            return {
                ...res,
                user: hydratedUser
            };
        } catch (error) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            throw error;
        }
    },

    signUp: async (data: SignUpRequestDTO) => {
        return await authApi.signUp(data);
    },

    refreshToken: async (data: RefreshTokenRequestDTO) => {
        return await authApi.refreshToken(data);
    },

    logout: async (refreshToken: string) => {
        return await authApi.logout(refreshToken);
    },

    loadCurrentAccess: async (user: User): Promise<User> => {
        return applyCurrentRole(user);
    }
}
