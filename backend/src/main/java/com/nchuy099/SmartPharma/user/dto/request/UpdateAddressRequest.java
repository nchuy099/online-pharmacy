package com.nchuy099.SmartPharma.user.dto.request;

import jakarta.validation.constraints.Pattern;
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
public class UpdateAddressRequest {
    String fullName;

    @Pattern(regexp = "^0[0-9]{9}$", message = "Phone number must be a valid Vietnamese mobile number (10 digits, starts with 0)")
    String phoneNumber;

    String address;
    Integer ghnProvinceId;
    Integer ghnDistrictId;
    String ghnWardCode;
    String provinceName;
    String districtName;
    String wardName;
    Boolean isDefault;
}
