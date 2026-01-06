package com.nchuy099.SmartPharma.inventory.entity;

import java.math.BigDecimal;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "inventory_transactions")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransactionEntity extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_id", nullable = false)
    InventoryEntity inventory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    TransactionType type;

    @Column(nullable = false)
    Integer quantity; // luôn là số dương

    @Column(nullable = true)
    BigDecimal unitCost;

    String note;

    @Column(name = "reference_type")
    String referenceType;

    @Column(name = "reference_id")
    java.util.UUID referenceId;

    @Column(name = "created_by")
    java.util.UUID createdBy;
}
