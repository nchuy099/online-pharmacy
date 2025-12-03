package com.nchuy099.SmartPharma.common.exception;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;

import lombok.extern.slf4j.Slf4j;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        // Business exception
        @ExceptionHandler(AppException.class)
        public ResponseEntity<ErrorResponse> handleAppException(AppException ex,
                        HttpServletRequest req) {
                ErrorCode errorCode = ex.getErrorCode();
                String path = req.getRequestURI();
                ErrorResponse errorResponse = new ErrorResponse(
                                errorCode.getCode(),
                                errorCode.getStatusCode(),
                                path,
                                ex.getMessage());
                return new ResponseEntity<>(errorResponse, errorCode.getStatus());

        }

        // @RequestBody validation
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex,
                        HttpServletRequest req) {

                String message = ex.getBindingResult()
                                .getFieldError()
                                .getDefaultMessage();

                return ResponseEntity.badRequest().body(
                                new ErrorResponse(ErrorCode.VALIDATION_ERROR.getCode(),
                                                ErrorCode.VALIDATION_ERROR.getStatusCode(),
                                                req.getRequestURI(),
                                                message));
        }

        // @RequestParam / @PathVariable validation
        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ErrorResponse> handleConstraintViolation(
                        ConstraintViolationException ex,
                        HttpServletRequest request) {
                String message = ex.getConstraintViolations()
                                .iterator()
                                .next()
                                .getMessage();

                return ResponseEntity.badRequest().body(
                                new ErrorResponse(ErrorCode.VALIDATION_ERROR.getCode(),
                                                ErrorCode.VALIDATION_ERROR.getStatusCode(),
                                                request.getRequestURI(),
                                                message));
        }

        // Missing request param
        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ErrorResponse> handleMissingParam(
                        MissingServletRequestParameterException ex,
                        HttpServletRequest request) {
                String message = "Missing parameter: " + ex.getParameterName();

                return ResponseEntity.badRequest().body(
                                new ErrorResponse(ErrorCode.BAD_REQUEST.getCode(),
                                                ErrorCode.BAD_REQUEST.getStatusCode(),
                                                request.getRequestURI(),
                                                message));
        }

        // Invalid JSON / parse error
        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponse> handleUnreadableBody(
                        HttpMessageNotReadableException ex,
                        HttpServletRequest request) {
                return ResponseEntity.badRequest().body(
                                new ErrorResponse(ErrorCode.BAD_REQUEST.getCode(),
                                                ErrorCode.BAD_REQUEST.getStatusCode(),
                                                request.getRequestURI(),
                                                "Invalid request body"));
        }

        // Param type mismatchs
        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ErrorResponse> handleTypeMismatch(
                        MethodArgumentTypeMismatchException ex,
                        HttpServletRequest request) {
                String message = String.format(
                                "Invalid value for '%s'", ex.getName());

                return ResponseEntity.badRequest().body(
                                new ErrorResponse(ErrorCode.BAD_REQUEST.getCode(),
                                                ErrorCode.BAD_REQUEST.getStatusCode(),
                                                request.getRequestURI(),
                                                message));
        }

        @ExceptionHandler({ AccessDeniedException.class, AuthorizationDeniedException.class })
        public ResponseEntity<ErrorResponse> handleAccessDenied(
                        RuntimeException ex,
                        HttpServletRequest request) {
                return ResponseEntity.status(403).body(
                                new ErrorResponse(ErrorCode.FORBIDDEN.getCode(),
                                                ErrorCode.FORBIDDEN.getStatusCode(),
                                                request.getRequestURI(),
                                                "Forbidden"));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGenericException(Exception ex,
                        HttpServletRequest req) {
                if (isClientDisconnect(ex)) {
                        log.warn("Client disconnected before response completed at {}: {}", req.getRequestURI(),
                                        rootCauseMessage(ex));
                        return ResponseEntity.status(HttpStatusCode.valueOf(499)).build();
                }

                log.error("Unhandled exception at {}", req.getRequestURI(), ex);
                ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
                String path = req.getRequestURI();
                ErrorResponse errorResponse = new ErrorResponse(
                                errorCode.getCode(),
                                errorCode.getStatusCode(),
                                path,
                                errorCode.getMessage());
                return new ResponseEntity<>(errorResponse, errorCode.getStatus());
        }

        private boolean isClientDisconnect(Throwable ex) {
                Throwable current = ex;
                while (current != null) {
                        if (current instanceof AsyncRequestNotUsableException) {
                                return true;
                        }
                        String className = current.getClass().getName();
                        if ("org.apache.catalina.connector.ClientAbortException".equals(className)) {
                                return true;
                        }

                        String message = current.getMessage();
                        if (message != null) {
                                String lower = message.toLowerCase();
                                if (lower.contains("broken pipe") || lower.contains("connection reset by peer")) {
                                        return true;
                                }
                        }
                        current = current.getCause();
                }
                return false;
        }

        private String rootCauseMessage(Throwable ex) {
                Throwable current = ex;
                Throwable last = ex;
                while (current != null) {
                        last = current;
                        current = current.getCause();
                }
                return last.getMessage() != null ? last.getMessage() : last.getClass().getSimpleName();
        }
}
