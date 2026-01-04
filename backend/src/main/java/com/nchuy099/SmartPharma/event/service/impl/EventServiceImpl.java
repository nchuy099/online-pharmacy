package com.nchuy099.SmartPharma.event.service.impl;

import com.nchuy099.SmartPharma.event.dto.request.CreateEventRequest;
import com.nchuy099.SmartPharma.event.entity.EventEntity;
import com.nchuy099.SmartPharma.event.repository.EventRepository;
import com.nchuy099.SmartPharma.event.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventServiceImpl implements EventService {

        private final EventRepository eventRepository;

        @Override
        @Transactional
        public void createEvent(CreateEventRequest request) {
                log.info("Received event request: userId={}, eventType={}, itemId={}, sessionId={}, metadata={}",
                                request.getUserId(), request.getEventType(), request.getItemId(),
                                request.getSessionId(), request.getMetadata());

                EventEntity event = EventEntity.builder()
                                .userId(request.getUserId() != null ? UUID.fromString(request.getUserId()) : null)
                                .eventType(request.getEventType())
                                .itemId(request.getItemId() != null ? UUID.fromString(request.getItemId()) : null)
                                .sessionId(request.getSessionId() != null ? UUID.fromString(request.getSessionId()) : null)
                                .metadata(request.getMetadata())
                                .build();

                log.info("Saving event entity: userId={}, itemId={}, eventType={}",
                                event.getUserId(), event.getItemId(), event.getEventType());

                EventEntity saved = eventRepository.save(event);
        }
}
