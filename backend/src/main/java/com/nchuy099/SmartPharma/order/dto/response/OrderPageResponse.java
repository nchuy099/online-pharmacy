package com.nchuy099.SmartPharma.order.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.nchuy099.SmartPharma.common.dto.Cursor;
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
public class OrderPageResponse {

    List<OrderResponse> orders;

    Pagination pagination;

}
