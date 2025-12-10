package com.nchuy099.SmartPharma.review.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.nchuy099.SmartPharma.review.dto.CreateReviewRequest;
import com.nchuy099.SmartPharma.review.dto.ReviewPageResponse;
import com.nchuy099.SmartPharma.review.dto.ReviewResponse;
import com.nchuy099.SmartPharma.review.dto.UpdateReviewRequest;
import com.nchuy099.SmartPharma.review.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/reviews")
@Slf4j
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/products/{productId}/list")
    public ReviewPageResponse getProductReviews(
            @PathVariable(name = "productId") UUID productId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Get reviews for product: {}", productId);
        return reviewService.getByProductId(productId, page, size);
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ReviewResponse createReview(@RequestBody @Valid CreateReviewRequest request) {
        log.info("Create review request received");
        return reviewService.create(request);
    }

    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ReviewResponse updateReview(
            @PathVariable(name = "id") UUID id,
            @RequestBody @Valid UpdateReviewRequest request) {
        log.info("Update review request received for id: {}", id);
        return reviewService.update(id, request);
    }

    @DeleteMapping("/{id}/delete")
    @PreAuthorize("hasRole('CUSTOMER')")
    public void deleteReview(@PathVariable(name = "id") UUID id) {
        log.info("Delete review request received for id: {}", id);
        reviewService.delete(id);
    }
}
