package com.nchuy099.SmartPharma.user.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdatePharmacistProfileReq {
    private String qualifications;
    private String education;
    private String experience;
    private String specialtyCode;
    private Boolean isApproved;
}
