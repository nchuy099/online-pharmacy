package com.nchuy099.SmartPharma.user.entity;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "addresses")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressEntity extends AbstractEntity {

    @Column(nullable = false)
    String fullName;

    @Column(nullable = false)
    String phoneNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    String address;

    Integer ghnProvinceId;
    Integer ghnDistrictId;
    String ghnWardCode;

    String provinceName;
    String districtName;
    String wardName;

    @Column(nullable = false)
    @Builder.Default
    Boolean isDefault = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    UserEntity user;
}