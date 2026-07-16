package com.nchuy099.SmartPharma.order.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewOrderReturnRequest {

    @Size(max = 1000)
    String reviewNote;
}
