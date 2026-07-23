package com.nchuy099.SmartPharma.payment.application.webhook;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.payment.dto.request.SePayWebhookRequest;
import com.nchuy099.SmartPharma.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProcessSePayWebhookUseCase {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderStatusPolicy orderStatusPolicy;
    private final OrderEventPublisher orderEventPublisher;

    @Value("${sepay.apiKey}")
    private String sepayApiKey;

    @Value("${sepay.accountNumber}")
    private String accountNumber;

    @Value("${sepay.bankName}")
    private String bankName;

    @Transactional
    public Map<String, Object> processWebhook(String authHeader, SePayWebhookRequest request) {
        log.info("Processing SePay webhook for transaction ID: {}", request.getId());

        // Validate API Key
        if (authHeader == null || !authHeader.equals("Apikey " + sepayApiKey)) {
            log.error("Invalid SePay API Key in Authorization header");
            throw new AppException(ErrorCode.UNAUTHORIZED, "Invalid API Key");
        }

        // 1. Anti-duplication check
        String externalId = String.valueOf(request.getId());
        Optional<PaymentEntity> existingPayment = paymentRepository.findByExternalTransactionId(externalId);
        if (existingPayment.isPresent()) {
            log.warn("Duplicate SePay transaction received: {}", externalId);
            return Map.of("success", true, "message", "Transaction already processed");
        }

        // 2. Find order by code
        String orderCode = request.getCode();
        if (orderCode == null || orderCode.isEmpty()) {
            // Fallback: try to extract ORD... from content or description using regex
            String searchSource = (request.getContent() != null ? request.getContent() : "") 
                                + (request.getDescription() != null ? " " + request.getDescription() : "");
            
            if (!searchSource.isEmpty()) {
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("ORD[0-9]{6}[A-Z0-9]{4,15}", java.util.regex.Pattern.CASE_INSENSITIVE);
                java.util.regex.Matcher matcher = pattern.matcher(searchSource);
                if (matcher.find()) {
                    orderCode = matcher.group().toUpperCase();
                    log.info("Extracted order code {} from content/description using regex", orderCode);
                }
            }

        }

        if (orderCode == null || orderCode.isEmpty()) {
            log.warn("SePay webhook missing order code. Content: {}, Description: {}", 
                    request.getContent(), request.getDescription());
            return Map.of("success", false, "message", "Missing order code");
        }

        final String finalOrderCode = orderCode;
        OrderEntity order = orderRepository.findByOrderCodeForUpdate(finalOrderCode)
                .orElseThrow(() -> {
                    log.error("Order not found for code: {}", finalOrderCode);
                    return new AppException(ErrorCode.NOT_FOUND, "Order not found");
                });

        // 3. Verify transfer type (only process incoming money)
        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            log.info("Ignoring non-incoming transaction: {} for order {}", request.getTransferType(), finalOrderCode);
            return Map.of("success", true, "message", "Transaction ignored (not 'in')");
        }

        PaymentEntity payment = order.getPayment();
        if (payment == null) {
            log.error("Payment entity missing for order: {}", finalOrderCode);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Payment entity missing");
        }
        if (order.getStatus() == com.nchuy099.SmartPharma.order.domain.enums.OrderStatus.CANCELLED) {
            log.warn("Ignoring payment webhook for cancelled order {}", finalOrderCode);
            return Map.of("success", false, "message", "Order already cancelled");
        }

        // 4. Verify amount (optional but safer)
        if (request.getTransferAmount().compareTo(order.getFinalAmount()) < 0) {
            log.warn("Partial payment received for order {}: expected {}, received {}",
                    finalOrderCode, order.getFinalAmount(), request.getTransferAmount());
            payment.setStatus(PaymentStatus.PARTIAL);
            payment.setExternalTransactionId(externalId);
            orderStatusPolicy.markPartialPayment(order);
            orderRepository.save(order);
            paymentRepository.save(payment);
            return Map.of("success", false, "message", "Partial payment");
        }


        // 5. Update status
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setExternalTransactionId(externalId);
        orderStatusPolicy.markPaymentSuccess(order);

        orderRepository.save(order);
        paymentRepository.save(payment);
        orderEventPublisher.publishPaymentSucceeded(order);

        log.info("Successfully marked order {} as paid and pending confirmation after SePay payment", finalOrderCode);
        return Map.of("success", true, "message", "Payment processed successfully");
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getBankName() {
        return bankName;
    }
}
