package com.nchuy099.SmartPharma.user.enums;

import java.util.Locale;

public enum RoleType {
    CUSTOMER,
    PHARMACIST,
    ADMIN;

    public static RoleType fromName(String value) {
        if (value == null) {
            return ADMIN;
        }
        return RoleType.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
