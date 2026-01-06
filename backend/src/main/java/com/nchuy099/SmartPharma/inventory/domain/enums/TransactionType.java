package com.nchuy099.SmartPharma.inventory.domain.enums;

public enum TransactionType {
    IMPORT,
    EXPORT, // ordered! paid
    RESERVE, // ordered! not payment >< RELEASE //Internal trans
    RELEASE, // Internal Trans
    RETURN,
}