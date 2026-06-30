package com.nchuy099.SmartPharma.inventory.dto.response;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import java.util.List;
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
public class InventoryLotPageResponse {
    InventoryResponse summary;
    List<InventoryLotResponse> lots;
    Pagination pagination;
}
