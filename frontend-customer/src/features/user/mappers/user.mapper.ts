import type { UserProfileResponse } from "../types/dto";
import type { User } from "../types/domain";

export const mapUserProfileToDomain = (dto: UserProfileResponse): User => {
    return {
        id: dto.userId,
        email: dto.email,
        fullName: dto.fullName,
        gender: (dto.gender as User["gender"]) ?? "OTHER",
        phoneNumber: dto.phoneNumber ?? "",
        dateOfBirth: dto.dateOfBirth ?? "",
        address: dto.address ?? "",
    };
};
