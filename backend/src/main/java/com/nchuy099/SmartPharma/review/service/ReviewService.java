package com.nchuy099.SmartPharma.review.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemRepository;
import com.nchuy099.SmartPharma.review.dto.CreateReviewRequest;
import com.nchuy099.SmartPharma.review.dto.ReviewPageResponse;
import com.nchuy099.SmartPharma.review.dto.ReviewResponse;
import com.nchuy099.SmartPharma.review.dto.UpdateReviewRequest;
import com.nchuy099.SmartPharma.review.entity.ReviewEntity;
import com.nchuy099.SmartPharma.review.repository.ReviewRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @Transactional
    public ReviewResponse create(CreateReviewRequest req) {
        log.info("Processing create review request for order item: {}", req.getOrderItemId());

        UUID userId = securityUtils.getCurrentUserId();
        UUID orderItemId = UUID.fromString(req.getOrderItemId());

        // Find order item and validate ownership
        OrderItemEntity orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order item not found"));

        // Verify the order belongs to the current user
        if (!orderItem.getOrder().getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "You are not authorized to review this item");
        }

        // Verify order status is DELIVERED
        if (orderItem.getOrder().getStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_NOT_DELIVERED,
                    "Order must be delivered before reviewing");
        }

        // Check if review already exists for this product in this order
        if (reviewRepository.existsByUserIdAndProductIdAndOrderId(userId, orderItem.getProduct().getId(), orderItem.getOrder().getId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS,
                    "You have already reviewed this product for this order");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        ReviewEntity review = ReviewEntity.builder()
                .user(user)
                .product(orderItem.getProduct())
                .orderItem(orderItem)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        reviewRepository.save(review);

        return mapToResponse(review);
    }

    @Transactional
    public ReviewResponse update(UUID reviewId, UpdateReviewRequest req) {
        log.info("Processing update review request for review id: {}", reviewId);

        UUID userId = securityUtils.getCurrentUserId();

        ReviewEntity review = reviewRepository.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND, "Review not found"));

        // Check if the 7-day edit window has passed
        var deliveredAt = review.getOrderItem().getOrder().getDeliveredAt();
        if (deliveredAt != null) {
            var now = java.time.Instant.now();
            var sevenDaysInSeconds = 7 * 24 * 60 * 60;
            if (now.isAfter(deliveredAt.plusSeconds(sevenDaysInSeconds))) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Review can only be edited within 7 days of delivery");
            }
        }

        if (req.getRating() != null) {
            review.setRating(req.getRating());
        }
        if (req.getComment() != null) {
            review.setComment(req.getComment());
        }

        reviewRepository.save(review);

        return mapToResponse(review);
    }

    @Transactional
    public void delete(UUID reviewId) {
        log.info("Processing delete review request for review id: {}", reviewId);

        UUID userId = securityUtils.getCurrentUserId();

        ReviewEntity review = reviewRepository.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND, "Review not found"));

        reviewRepository.delete(review);
    }

    public ReviewPageResponse getByProductId(UUID productId, int page, int size) {
        log.info("Fetching reviews for product: {}", productId);

        if (page > 0)
            page--;
        Pageable pageable = PageRequest.of(page, size);

        Page<ReviewEntity> reviewPage = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);

        Double averageRating = reviewRepository.findAverageRatingByProductId(productId);
        long totalReviews = reviewRepository.countByProductId(productId);

        return ReviewPageResponse.builder()
                .reviews(reviewPage.getContent().stream().map(this::mapToResponse).toList())
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(reviewPage.getTotalPages())
                        .totalElements(reviewPage.getTotalElements())
                        .build())
                .averageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews)
                .build();
    }

    private ReviewResponse mapToResponse(ReviewEntity review) {
        return ReviewResponse.builder()
                .id(review.getId().toString())
                .rating(review.getRating())
                .comment(review.getComment())
                .userName(review.getUser().getFullName())
                .productId(review.getProduct().getId().toString())
                .productName(review.getProduct().getName())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
