export type ProfileFormData = {
    fullName: string;
    phoneNumber: string;
    gender: string;
    dateOfBirth: string;
};

export type ProfileFormErrors = Partial<Record<keyof ProfileFormData, string>>;

const ALLOWED_GENDERS = new Set(["MALE", "FEMALE", "OTHER"]);

const isValidDateString = (value: string) => {
    if (!value) return true;

    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
};

export const validateProfileForm = (data: ProfileFormData): ProfileFormErrors => {
    const errors: ProfileFormErrors = {};

    const fullNameError = validateProfileField("fullName", data);
    const phoneNumberError = validateProfileField("phoneNumber", data);
    const genderError = validateProfileField("gender", data);
    const dateOfBirthError = validateProfileField("dateOfBirth", data);

    if (fullNameError) errors.fullName = fullNameError;
    if (phoneNumberError) errors.phoneNumber = phoneNumberError;
    if (genderError) errors.gender = genderError;
    if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;

    return errors;
};

export const normalizeProfileForm = (data: ProfileFormData): ProfileFormData => ({
    fullName: data.fullName.trim(),
    phoneNumber: data.phoneNumber.trim(),
    gender: data.gender.trim(),
    dateOfBirth: data.dateOfBirth.trim(),
});

export const validateProfileField = (
    field: keyof ProfileFormData,
    data: ProfileFormData
): string | undefined => {
    const value = data[field].trim();

    if (field === "fullName") {
        return value ? undefined : "Họ và tên không được để trống.";
    }

    if (field === "phoneNumber") {
        if (!value) return undefined;
        if (value.length < 10 || value.length > 15) {
            return "Số điện thoại phải có từ 10 đến 15 ký tự.";
        }
        return undefined;
    }

    if (field === "gender") {
        if (!value) {
            return "Vui lòng chọn giới tính.";
        }
        return ALLOWED_GENDERS.has(value) ? undefined : "Giới tính không hợp lệ.";
    }

    if (field === "dateOfBirth") {
        return value && !isValidDateString(value) ? "Ngày sinh không hợp lệ." : undefined;
    }

    return undefined;
};
