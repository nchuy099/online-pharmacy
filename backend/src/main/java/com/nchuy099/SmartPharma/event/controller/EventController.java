package com.nchuy099.SmartPharma.event.controller;

import com.nchuy099.SmartPharma.common.dto.ApiResponse;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.event.dto.request.CreateEventRequest;
import com.nchuy099.SmartPharma.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createEvent(@RequestBody @Valid CreateEventRequest request) {
        try {
            eventService.createEvent(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(
                            ErrorCode.SUCCESS.getCode(),
                            HttpStatus.CREATED.value(),
                            "Event tracked successfully",
                            null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                            HttpStatus.INTERNAL_SERVER_ERROR.value(),
                            "Failed to track event",
                            null));
        }
    }
}
