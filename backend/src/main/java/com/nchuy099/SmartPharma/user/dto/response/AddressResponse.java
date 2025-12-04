package com.nchuy099.SmartPharma.user.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressResponse {
    String id;
    String fullName;
    String phoneNumber;
    String address;
    Integer ghnProvinceId;
    Integer ghnDistrictId;
    String ghnWardCode;
    String provinceName;
    String districtName;
    String wardName;
    String fullAddress;
    Boolean isDefault;
}