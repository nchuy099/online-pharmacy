package com.nchuy099.SmartPharma.user.dto.response;

import java.util.List;

import com.nchuy099.SmartPharma.common.dto.Pagination;

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
public class AddressListResponse {
    List<AddressResponse> addresses;
    Pagination pagination;
}