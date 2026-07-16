package com.nchuy099.SmartPharma.order.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateOrderReturnRequest {

    @NotBlank
    @Size(max = 1000)
    String reason;

    List<String> imageUrls;
}
