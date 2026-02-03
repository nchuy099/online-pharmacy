import { getMe, updateMe } from "../api/user.api";
import { mapUserProfileToDomain } from "../mappers/user.mapper";
import type { User } from "../types/domain";

export const userService = {
    async getCurrentUserProfile(accessToken?: string): Promise<User> {
        try {
            const data = await getMe(accessToken);
            return mapUserProfileToDomain(data);
        } catch (error) {
            throw error;
        }
    },
    async updateProfile(data: any): Promise<User> {
        const resp = await updateMe(data);
        return mapUserProfileToDomain(resp);
    }
};
