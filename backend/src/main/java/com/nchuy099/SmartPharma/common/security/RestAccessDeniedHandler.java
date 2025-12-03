package com.nchuy099.SmartPharma.common.security;

import java.io.IOException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.exception.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

        @Override
        public void handle(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");

                ErrorResponse error = new ErrorResponse(
                                ErrorCode.FORBIDDEN.getCode(),
                                ErrorCode.FORBIDDEN.getStatusCode(),
                                request.getRequestURI(),
                                ErrorCode.FORBIDDEN.getMessage());

                response.getWriter().write(
                                new ObjectMapper().writeValueAsString(error));
        }
}
