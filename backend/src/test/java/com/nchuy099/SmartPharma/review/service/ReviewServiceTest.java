package com.nchuy099.SmartPharma.review.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemRepository;
import com.nchuy099.SmartPharma.review.dto.CreateReviewRequest;
import com.nchuy099.SmartPharma.review.dto.UpdateReviewRequest;
import com.nchuy099.SmartPharma.review.entity.ReviewEntity;
import com.nchuy099.SmartPharma.review.repository.ReviewRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class ReviewServiceTest {

    private ReviewRepository reviewRepository;
    private OrderItemRepository orderItemRepository;
    private SecurityUtils securityUtils;
    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewRepository = mock(ReviewRepository.class);
        orderItemRepository = mock(OrderItemRepository.class);
        securityUtils = mock(SecurityUtils.class);

        reviewService = new ReviewService(
                reviewRepository,
                orderItemRepository,
                mock(UserRepository.class),
                securityUtils);
    }

    @Test
    void createShouldRejectWhenOrderItemNotOwnedByCurrentUser() {
        UUID currentUserId = UUID.randomUUID();
        UUID orderItemId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        UserEntity owner = UserEntity.builder().build();
        owner.setId(ownerId);

        OrderEntity order = OrderEntity.builder()
                .user(owner)
                .status(OrderStatus.DELIVERED)
                .finalAmount(BigDecimal.TEN)
                .build();

        OrderItemEntity orderItem = OrderItemEntity.builder()
                .order(order)
                .build();

        when(securityUtils.getCurrentUserId()).thenReturn(currentUserId);
        when(orderItemRepository.findById(orderItemId)).thenReturn(Optional.of(orderItem));

        CreateReviewRequest request = CreateReviewRequest.builder()
                .orderItemId(orderItemId.toString())
                .rating(5)
                .comment("good")
                .build();

        AppException ex = assertThrows(AppException.class, () -> reviewService.create(request));
        assertEquals("You are not authorized to review this item", ex.getMessage());
    }

    @Test
    void updateShouldRejectAfterSevenDaysFromDelivery() {
        UUID currentUserId = UUID.randomUUID();
        UUID reviewId = UUID.randomUUID();

        UserEntity owner = UserEntity.builder().build();
        owner.setId(currentUserId);

        OrderEntity order = OrderEntity.builder()
                .user(owner)
                .status(OrderStatus.DELIVERED)
                .finalAmount(BigDecimal.ONE)
                .deliveredAt(Instant.now().minus(8, ChronoUnit.DAYS))
                .build();

        OrderItemEntity orderItem = OrderItemEntity.builder()
                .order(order)
                .build();

        ReviewEntity review = ReviewEntity.builder()
                .orderItem(orderItem)
                .rating(4)
                .comment("old")
                .build();

        when(securityUtils.getCurrentUserId()).thenReturn(currentUserId);
        when(reviewRepository.findByIdAndUserId(reviewId, currentUserId)).thenReturn(Optional.of(review));

        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(5)
                .comment("new")
                .build();

        AppException ex = assertThrows(AppException.class, () -> reviewService.update(reviewId, request));
        assertEquals("Review can only be edited within 7 days of delivery", ex.getMessage());
    }
}
