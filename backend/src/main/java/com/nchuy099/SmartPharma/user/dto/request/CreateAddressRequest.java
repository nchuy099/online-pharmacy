package com.nchuy099.SmartPharma.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateAddressRequest {
    @NotBlank(message = "Full name is required")
    String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^0[0-9]{9}$", message = "Phone number must be a valid Vietnamese mobile number (10 digits, starts with 0)")
    String phoneNumber;

    @NotBlank(message = "Address is required")
    String address;

    @NotNull(message = "ghnProvinceId is required")
    Integer ghnProvinceId;

    @NotNull(message = "ghnDistrictId is required")
    Integer ghnDistrictId;

    @NotBlank(message = "ghnWardCode is required")
    String ghnWardCode;

    @NotBlank(message = "provinceName is required")
    String provinceName;

    @NotBlank(message = "districtName is required")
    String districtName;

    @NotBlank(message = "wardName is required")
    String wardName;

    Boolean isDefault;
}
