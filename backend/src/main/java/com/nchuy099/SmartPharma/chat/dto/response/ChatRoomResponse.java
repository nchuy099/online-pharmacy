package com.nchuy099.SmartPharma.chat.dto.response;

import java.time.Instant;
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
public class ChatRoomResponse {
    String id;
    String consultationId;
    List<String> participantIds;
    String type;
    String status;
    String title;
    String customerName;
    String customerId;
    String pharmacistName;
    Instant createdAt;
    Instant updatedAt;
    ChatMessageResponse lastMessage;
}
