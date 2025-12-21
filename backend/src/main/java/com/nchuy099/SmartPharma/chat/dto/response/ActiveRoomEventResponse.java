package com.nchuy099.SmartPharma.chat.dto.response;

import java.time.Instant;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActiveRoomEventResponse {
    private String eventType;
    private String roomId;
    private String status;
    private String customerId;
    private String customerName;
    private Instant updatedAt;
}
