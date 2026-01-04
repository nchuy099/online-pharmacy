package com.nchuy099.SmartPharma.consultation.dto.response;

import java.util.List;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PatientHistoryResponse {
    String customerId;
    String customerName;
    Integer age;
    String gender;
    String allergies;
    
    // Recent orders
    List<OrderResponse> recentOrders;
    Pagination ordersPagination;

    // Prescriptions history
    List<PrescriptionResponse> prescriptions;
    Pagination prescriptionsPagination;
}
