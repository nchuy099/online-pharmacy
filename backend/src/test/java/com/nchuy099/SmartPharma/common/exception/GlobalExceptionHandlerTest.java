package com.nchuy099.SmartPharma.common.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler globalExceptionHandler;
    private MockHttpServletRequest request;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        globalExceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/products/list");
        objectMapper = new ObjectMapper();
    }

    @Test
    void handleGenericExceptionShouldReturn499ForClientDisconnect() {
        AsyncRequestNotUsableException ex = new AsyncRequestNotUsableException(
                "ServletOutputStream failed to write: java.io.IOException: Broken pipe");

        ResponseEntity<ErrorResponse> response = globalExceptionHandler.handleGenericException(ex, request);

        assertEquals(HttpStatusCode.valueOf(499), response.getStatusCode());
    }

    @Test
    void handleGenericExceptionShouldReturn500ForUnexpectedServerErrors() {
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleGenericException(new RuntimeException("boom"), request);

        assertEquals(500, response.getStatusCode().value());
    }

    @Test
    void handleGenericExceptionShouldSerializeStringErrorCode() throws Exception {
        ResponseEntity<ErrorResponse> response = globalExceptionHandler
                .handleGenericException(new RuntimeException("boom"), request);

        String json = objectMapper.writeValueAsString(response.getBody());

        assertTrue(json.contains("\"code\":\"INTERNAL_SERVER_ERROR\""));
        assertTrue(json.contains("\"status\":500"));
        assertTrue(json.contains("\"success\":false"));
    }
}
