package com.nchuy099.SmartPharma.event.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.nchuy099.SmartPharma.event.dto.request.CreateEventRequest;
import com.nchuy099.SmartPharma.event.entity.EventEntity;
import com.nchuy099.SmartPharma.event.enums.EventType;
import com.nchuy099.SmartPharma.event.repository.EventRepository;
import com.nchuy099.SmartPharma.event.service.impl.EventServiceImpl;

class EventServiceImplTest {

    private EventRepository eventRepository;
    private EventServiceImpl eventService;

    @BeforeEach
    void setUp() {
        eventRepository = mock(EventRepository.class);
        eventService = new EventServiceImpl(eventRepository);
        when(eventRepository.save(any(EventEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createEventShouldParseUuidFieldsAndPersist() {
        String userId = UUID.randomUUID().toString();
        String itemId = UUID.randomUUID().toString();
        String sessionId = UUID.randomUUID().toString();

        CreateEventRequest request = CreateEventRequest.builder()
                .userId(userId)
                .eventType(EventType.CLICK)
                .itemId(itemId)
                .sessionId(sessionId)
                .metadata("{\"source\":\"home\"}")
                .build();

        eventService.createEvent(request);

        ArgumentCaptor<EventEntity> captor = ArgumentCaptor.forClass(EventEntity.class);
        verify(eventRepository).save(captor.capture());
        EventEntity saved = captor.getValue();

        assertEquals(UUID.fromString(userId), saved.getUserId());
        assertEquals(UUID.fromString(itemId), saved.getItemId());
        assertEquals(UUID.fromString(sessionId), saved.getSessionId());
        assertEquals(EventType.CLICK, saved.getEventType());
    }

    @Test
    void createEventShouldAllowNullOptionalIds() {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType(EventType.VIEW)
                .metadata("{}")
                .build();

        eventService.createEvent(request);

        ArgumentCaptor<EventEntity> captor = ArgumentCaptor.forClass(EventEntity.class);
        verify(eventRepository).save(captor.capture());
        EventEntity saved = captor.getValue();

        assertNull(saved.getUserId());
        assertNull(saved.getItemId());
        assertNull(saved.getSessionId());
        assertEquals(EventType.VIEW, saved.getEventType());
    }
}
