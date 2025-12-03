package com.nchuy099.SmartPharma.common.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public enum ErrorCode {

    SUCCESS("SUCCESS", HttpStatus.OK, "Success"),
    BAD_REQUEST("BAD_REQUEST", HttpStatus.BAD_REQUEST, "Bad request"),
    VALIDATION_ERROR("VALIDATION_ERROR", HttpStatus.BAD_REQUEST, "Validation failed"),
    UNAUTHORIZED("UNAUTHORIZED", HttpStatus.UNAUTHORIZED, "Unauthorized"),
    FORBIDDEN("FORBIDDEN", HttpStatus.FORBIDDEN, "Forbidden"),
    NOT_FOUND("NOT_FOUND", HttpStatus.NOT_FOUND, "Not found"),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND, "Resource not found"),
    PATIENT_NOT_FOUND("PATIENT_NOT_FOUND", HttpStatus.NOT_FOUND, "Patient not found"),
    USER_NOT_FOUND("USER_NOT_FOUND", HttpStatus.NOT_FOUND, "User not found"),
    ROLE_NOT_FOUND("ROLE_NOT_FOUND", HttpStatus.NOT_FOUND, "Role not found"),
    CONSULTATION_NOT_FOUND("CONSULTATION_NOT_FOUND", HttpStatus.NOT_FOUND, "Consultation not found"),
    ORDER_NOT_FOUND("ORDER_NOT_FOUND", HttpStatus.NOT_FOUND, "Order not found"),
    CART_NOT_FOUND("CART_NOT_FOUND", HttpStatus.NOT_FOUND, "Cart not found"),
    CART_ITEM_NOT_FOUND("CART_ITEM_NOT_FOUND", HttpStatus.NOT_FOUND, "Cart item not found"),
    PRODUCT_NOT_FOUND("PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND, "Product not found"),
    VARIANT_NOT_FOUND("VARIANT_NOT_FOUND", HttpStatus.NOT_FOUND, "Variant not found"),
    ADDRESS_NOT_FOUND("ADDRESS_NOT_FOUND", HttpStatus.NOT_FOUND, "Address not found"),
    REVIEW_NOT_FOUND("REVIEW_NOT_FOUND", HttpStatus.NOT_FOUND, "Review not found"),
    CHECKOUT_QUOTE_NOT_FOUND("CHECKOUT_QUOTE_NOT_FOUND", HttpStatus.NOT_FOUND, "Checkout quote not found"),
    PAYMENT_NOT_FOUND("PAYMENT_NOT_FOUND", HttpStatus.NOT_FOUND, "Payment not found"),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED, "Invalid credentials"),
    INVALID_REFRESH_TOKEN("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "Invalid refresh token"),
    INVALID_RESET_PASSWORD_TOKEN("INVALID_RESET_PASSWORD_TOKEN", HttpStatus.UNAUTHORIZED, "Invalid reset password token"),
    RESET_PASSWORD_TOKEN_USED("RESET_PASSWORD_TOKEN_USED", HttpStatus.CONFLICT, "Reset password token has already been used"),
    USER_LOCKED("USER_LOCKED", HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa"),
    ACCOUNT_DELETED("ACCOUNT_DELETED", HttpStatus.FORBIDDEN, "Tài khoản đã được xóa"),
    INVALID_OTP("INVALID_OTP", HttpStatus.BAD_REQUEST, "Invalid OTP"),
    OTP_EXPIRED("OTP_EXPIRED", HttpStatus.BAD_REQUEST, "OTP has expired"),
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", HttpStatus.CONFLICT, "Email is already taken"),
    PHONE_ALREADY_EXISTS("PHONE_ALREADY_EXISTS", HttpStatus.CONFLICT, "Phone number is already taken"),
    ROLE_ALREADY_EXISTS("ROLE_ALREADY_EXISTS", HttpStatus.CONFLICT, "Role already exists"),
    REVIEW_ALREADY_EXISTS("REVIEW_ALREADY_EXISTS", HttpStatus.CONFLICT, "You have already reviewed this item"),
    ORDER_ALREADY_CANCELLED("ORDER_ALREADY_CANCELLED", HttpStatus.CONFLICT, "Order is already cancelled"),
    ORDER_NOT_DELIVERED("ORDER_NOT_DELIVERED", HttpStatus.BAD_REQUEST, "Order must be delivered before reviewing"),
    CONSULTATION_ALREADY_CANCELLED("CONSULTATION_ALREADY_CANCELLED", HttpStatus.BAD_REQUEST, "Consultation is already cancelled"),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"),
    CONFLICT("CONFLICT", HttpStatus.CONFLICT, "Conflict");

    private final String code;
    private final HttpStatus status;
    private final String message;

    ErrorCode(String code, HttpStatus status, String message) {
        this.code = code;
        this.status = status;
        this.message = message;
    }

    public int getStatusCode() {
        return status.value();
    }

}
