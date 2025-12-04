package com.nchuy099.SmartPharma.user.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PharmacistUpdateRequest {
    String qualifications;
    String education;
    String experience;
    String specialtyCode;
}
