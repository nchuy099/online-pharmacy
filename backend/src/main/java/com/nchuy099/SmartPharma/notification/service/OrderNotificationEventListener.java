package com.nchuy099.SmartPharma.notification.service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.nchuy099.SmartPharma.notification.domain.NotificationChannel;
import com.nchuy099.SmartPharma.notification.domain.NotificationMessage;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderCancelledEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderConfirmedEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderCreatedEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderDeliveredEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderProcessingStartedEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderShippedEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.PaymentSucceededEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.ReturnApprovedEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.ReturnRejectedEvent;
import com.nchuy099.SmartPharma.order.infrastructure.event.ReturnRequestedEvent;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderNotificationEventListener {

    private static final Set<NotificationChannel> CUSTOMER_CHANNELS = Set.of(
            NotificationChannel.GMAIL,
            NotificationChannel.WEBSOCKET);

    private static final Set<NotificationChannel> ADMIN_CHANNELS = Set.of(NotificationChannel.WEBSOCKET);

    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderCreatedEvent event) {
        sendCustomer(event.orderId(), "Đơn hàng đã được tạo",
                "Đơn hàng %s đã được tạo thành công.");
        sendAdmin(event.orderId(), "Có đơn hàng mới", "Đơn hàng %s vừa được tạo.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(PaymentSucceededEvent event) {
        sendCustomer(event.orderId(), "Thanh toán thành công",
                "Thanh toán cho đơn hàng %s đã được ghi nhận.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderConfirmedEvent event) {
        sendCustomer(event.orderId(), "Đơn hàng đã được xác nhận",
                "Đơn hàng %s đã được xác nhận.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderProcessingStartedEvent event) {
        sendCustomer(event.orderId(), "Đơn hàng đang được xử lý",
                "Đơn hàng %s đang được chuẩn bị.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderShippedEvent event) {
        sendCustomer(event.orderId(), "Đơn hàng đang giao",
                "Đơn hàng %s đã được bàn giao vận chuyển.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderDeliveredEvent event) {
        sendCustomer(event.orderId(), "Đơn hàng đã giao",
                "Đơn hàng %s đã được giao thành công.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderCancelledEvent event) {
        sendCustomer(event.orderId(), "Đơn hàng đã hủy",
                "Đơn hàng %s đã được hủy.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ReturnRequestedEvent event) {
        sendCustomer(event.orderId(), "Yêu cầu trả hàng đã được ghi nhận",
                "Yêu cầu trả hàng cho đơn %s đã được ghi nhận.");
        sendAdmin(event.orderId(), "Có yêu cầu trả hàng", "Đơn hàng %s có yêu cầu trả hàng mới.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ReturnApprovedEvent event) {
        sendCustomer(event.orderId(), "Yêu cầu trả hàng được duyệt",
                "Yêu cầu trả hàng cho đơn %s đã được duyệt.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ReturnRejectedEvent event) {
        sendCustomer(event.orderId(), "Yêu cầu trả hàng bị từ chối",
                "Yêu cầu trả hàng cho đơn %s đã bị từ chối.");
    }

    private void sendCustomer(UUID orderId, String subject, String bodyTemplate) {
        orderRepository.findByIdWithUserForNotification(orderId).ifPresent(order -> notificationService.send(customerMessage(order, subject,
                bodyTemplate.formatted(order.getOrderCode()))));
    }

    private void sendAdmin(UUID orderId, String subject, String bodyTemplate) {
        orderRepository.findByIdWithUserForNotification(orderId).ifPresent(order -> notificationService.send(NotificationMessage.builder()
                .subject(subject)
                .body(bodyTemplate.formatted(order.getOrderCode()))
                .payload(payload(order))
                .channels(ADMIN_CHANNELS)
                .build()));
    }

    private NotificationMessage customerMessage(OrderEntity order, String subject, String body) {
        return NotificationMessage.builder()
                .recipientUserId(order.getUser() != null ? order.getUser().getId() : null)
                .recipientEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .subject(subject)
                .body(body)
                .payload(payload(order))
                .channels(CUSTOMER_CHANNELS)
                .build();
    }

    private Map<String, Object> payload(OrderEntity order) {
        return Map.of(
                "orderId", order.getId() != null ? order.getId().toString() : "",
                "orderCode", order.getOrderCode() != null ? order.getOrderCode() : "",
                "status", order.getStatus() != null ? order.getStatus().name() : "");
    }
}
