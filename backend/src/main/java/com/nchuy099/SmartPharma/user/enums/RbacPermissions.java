package com.nchuy099.SmartPharma.user.enums;

public final class RbacPermissions {

    private RbacPermissions() {
    }

    public static final String READ_ANALYTICS = "READ_ANALYTICS";

    public static final String CREATE_CATEGORY = "CREATE_CATEGORY";
    public static final String DELETE_CATEGORY = "DELETE_CATEGORY";
    public static final String READ_CATEGORY = "READ_CATEGORY";
    public static final String UPDATE_CATEGORY = "UPDATE_CATEGORY";

    public static final String IMPORT_INVENTORY = "IMPORT_INVENTORY";
    public static final String READ_INVENTORY = "READ_INVENTORY";

    public static final String CONFIRM_ORDER = "CONFIRM_ORDER";
    public static final String READ_ORDER = "READ_ORDER";
    public static final String SHIP_ORDER = "SHIP_ORDER";

    public static final String READ_PAYMENT = "READ_PAYMENT";

    public static final String CREATE_PRODUCT = "CREATE_PRODUCT";
    public static final String DELETE_PRODUCT = "DELETE_PRODUCT";
    public static final String UPLOAD_PRODUCT_IMAGE = "UPLOAD_PRODUCT_IMAGE";
    public static final String READ_PRODUCT = "READ_PRODUCT";
    public static final String UPDATE_PRODUCT = "UPDATE_PRODUCT";

    public static final String MANAGE_RBAC = "MANAGE_RBAC";
    public static final String READ_RBAC = "READ_RBAC";

    public static final String CREATE_USER = "CREATE_USER";
    public static final String RESET_USER_PASSWORD = "RESET_USER_PASSWORD";
    public static final String READ_USER = "READ_USER";
    public static final String ASSIGN_USER_ROLE = "ASSIGN_USER_ROLE";
    public static final String UPDATE_USER_STATUS = "UPDATE_USER_STATUS";
    public static final String UPDATE_USER = "UPDATE_USER";
}
