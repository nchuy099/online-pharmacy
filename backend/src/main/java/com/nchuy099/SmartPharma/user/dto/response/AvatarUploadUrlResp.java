package com.nchuy099.SmartPharma.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvatarUploadUrlResp {

    private String uploadUrl;
    private String fileUrl;

}
