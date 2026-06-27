import axios from "axios";

type ApiErrorPayload = {
    code?: string;
    message?: string;
    error?: string;
    status?: number;
};

const ERROR_MESSAGES: Record<string, string> = {
    BAD_REQUEST: "Yêu cầu không hợp lệ.",
    VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
    UNAUTHORIZED: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    NOT_FOUND: "Không tìm thấy dữ liệu.",
    RESOURCE_NOT_FOUND: "Không tìm thấy dữ liệu.",
    USER_NOT_FOUND: "Không tìm thấy người dùng.",
    ROLE_NOT_FOUND: "Không tìm thấy vai trò.",
    ORDER_NOT_FOUND: "Không tìm thấy đơn hàng.",
    CART_NOT_FOUND: "Không tìm thấy giỏ hàng.",
    CART_ITEM_NOT_FOUND: "Không tìm thấy sản phẩm trong giỏ hàng.",
    PRODUCT_NOT_FOUND: "Không tìm thấy sản phẩm.",
    VARIANT_NOT_FOUND: "Không tìm thấy biến thể sản phẩm.",
    ADDRESS_NOT_FOUND: "Không tìm thấy địa chỉ.",
    REVIEW_NOT_FOUND: "Không tìm thấy đánh giá.",
    PAYMENT_NOT_FOUND: "Không tìm thấy thông tin thanh toán.",
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
    INVALID_REFRESH_TOKEN: "Phiên đăng nhập không hợp lệ.",
    INVALID_RESET_PASSWORD_TOKEN: "Liên kết đặt lại mật khẩu không hợp lệ.",
    RESET_PASSWORD_TOKEN_USED: "Liên kết đặt lại mật khẩu đã được sử dụng.",
    USER_LOCKED: "Tài khoản đã bị khóa.",
    EMAIL_ALREADY_EXISTS: "Email đã được sử dụng.",
    PHONE_ALREADY_EXISTS: "Số điện thoại đã được sử dụng.",
    REVIEW_ALREADY_EXISTS: "Bạn đã đánh giá sản phẩm này rồi.",
    ORDER_ALREADY_CANCELLED: "Đơn hàng đã được hủy.",
    ORDER_NOT_DELIVERED: "Đơn hàng cần được giao trước khi đánh giá.",
    CONFLICT: "Dữ liệu đã tồn tại hoặc không thể thực hiện thao tác này.",
    INTERNAL_SERVER_ERROR: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export const isUserLockedApiError = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) {
        return false;
    }

    const data = error.response?.data as ApiErrorPayload | undefined;
    return data?.code === "USER_LOCKED";
};

export const resolveApiErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiErrorPayload | undefined;
        const code = isNonEmptyString(data?.code) ? data.code : undefined;
        const message = isNonEmptyString(data?.message) ? data.message : undefined;
        const apiError = isNonEmptyString(data?.error) ? data.error : undefined;

        if (code) {
            if (code === "VALIDATION_ERROR" && message) {
                return message;
            }

            if (message) {
                return message;
            }

            const translated = ERROR_MESSAGES[code];
            if (translated) {
                return translated;
            }
        }

        if (message) {
            return message;
        }

        if (apiError) {
            return apiError;
        }
    }

    if (error instanceof Error && isNonEmptyString(error.message)) {
        return error.message;
    }

    return fallback;
};
