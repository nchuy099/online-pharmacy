package com.nchuy099.SmartPharma.order.checkout.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.checkout.entity.CheckoutQuoteEntity;
import com.nchuy099.SmartPharma.order.checkout.repository.CheckoutQuoteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CheckoutQuoteService {

    private static final long QUOTE_TTL_SECONDS = 5 * 60;

    private final CheckoutQuoteRepository checkoutQuoteRepository;

    public CheckoutQuoteEntity createQuote(CheckoutQuoteEntity quote) {
        quote.setExpiresAt(Instant.now().plusSeconds(QUOTE_TTL_SECONDS));
        quote.setConsumedAt(null);
        return checkoutQuoteRepository.save(quote);
    }

    public CheckoutQuoteEntity getValidQuoteForUpdate(UUID quoteId, UUID userId) {
        CheckoutQuoteEntity quote = checkoutQuoteRepository.findByIdAndUserIdForUpdate(quoteId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Checkout quote not found"));
        validateQuote(quote);
        return quote;
    }

    public void consumeQuote(CheckoutQuoteEntity quote) {
        quote.setConsumedAt(Instant.now());
        checkoutQuoteRepository.save(quote);
    }

    private void validateQuote(CheckoutQuoteEntity quote) {
        if (quote.getConsumedAt() != null) {
            throw new AppException(ErrorCode.CONFLICT, "Checkout quote has already been used");
        }
        Instant now = Instant.now();
        if (quote.getExpiresAt() == null || !now.isBefore(quote.getExpiresAt())) {
            throw new AppException(ErrorCode.CONFLICT, "Checkout quote has expired");
        }
    }
}
