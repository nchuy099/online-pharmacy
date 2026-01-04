package com.nchuy099.SmartPharma.event.dto.request;

import com.nchuy099.SmartPharma.event.enums.EventType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {

    private String userId;
    
    @NotNull(message = "Event type is required")
    private EventType eventType;

    private String itemId;
    
    private String sessionId;
    
    private String metadata; // Expecting a JSON string payload
}
