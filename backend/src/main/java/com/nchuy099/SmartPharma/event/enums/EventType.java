package com.nchuy099.SmartPharma.event.enums;

/**
 * Enum for standardized interaction events.
 */
public enum EventType {
    VIEW,        // When a product is visible in a list (tracked via IntersectionObserver)
    CLICK,       // When a user clicks to view product details
    ADD_TO_CART, // When a user adds a product to their cart
    CHECKOUT,    // When a user enters the checkout process
    PURCHASE     // When a user successfully completes a purchase
}
