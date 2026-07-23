---
title: Commerce Hardening Additions - 2026-07-23
type: implementation_note
permalink: online-pharmacy/implementation/commerce-hardening-additions-2026-07-23
tags:
- smartpharma
- orders
- payments
- sku
- notifications
---

# Commerce Hardening Additions - 2026-07-23

## Context
Implemented a set of SmartPharma commerce hardening additions inspired by the go-ecom-k8s catalog/order patterns. The work focused on checkout safety, SKU-based catalog operations, order cancellation lifecycle, and business notifications.

## Decisions

- Idempotency is stored directly on `orders.idempotency_key` instead of a separate idempotency table.
- The database enforces idempotent checkout with a partial unique index on `(user_id, idempotency_key)` where the key is not null.
- Frontend customer checkout generates one `Idempotency-Key` per submit attempt and sends it to `POST /orders/create`. Backend returns the existing order for duplicate `(user, key)` requests.
- Payment webhook duplicate protection is strengthened with a partial unique index on `payments.external_transaction_id`.
- Product variants now accept optional admin-provided SKU values while preserving generated SKU fallback behavior.
- Order lifecycle gained `CONFIRMED` and admin `PROCESS_ORDER`; admin can move confirmed orders into processing.
- Cancellation/refund behavior now distinguishes paid orders by moving payment toward `REFUND_PENDING` instead of immediate `REFUNDED`.
- Business notifications use a strategy pattern with two concrete strategies: Gmail and WebSocket.
- Notification events are handled after transaction commit to avoid notifying about rolled-back order/payment changes.

## Backend Areas Changed

- Flyway migration: `backend/src/main/resources/db/migration/postgresql/V34__add_order_idempotency_and_notification_lifecycle.sql`
- Order creation/idempotency: `CreateOrderUseCase`, `OrderController`, `OrderEntity`, `OrderRepository`
- Lifecycle/cancel/refund: `OrderStatusPolicy`, `OrderCancelPolicy`, `OrderCancellationService`, `AdminCancelOrderUseCase`, `ProcessOrderUseCase`, `AdminOrderController`
- Payment webhook eventing: `ProcessSePayWebhookUseCase`
- Return flow eventing/refund pending: `OrderReturnRequestService`
- Notification domain/service/strategies: `notification/domain`, `notification/service`, `notification/strategy`
- SMTP config: `application.yml` uses `email_user`, `email_password`, and `smtp_port`; port 465 is used for Gmail SSL.

## Frontend Areas Changed

- Customer checkout idempotency key handling: `frontend-customer/src/features/order/pages/CheckoutPage.tsx`
- Customer order API/client hooks: `frontend-customer/src/features/order/api/order.api.ts`, order mutation hooks/services
- Admin variant SKU input/types: `frontend-admin/src/features/product/components/ProductVariantsSection.tsx`, `frontend-admin/src/features/product/types/dto.ts`

## Verification

- Backend: `./gradlew test` passed.
- Customer frontend: `npm run build` passed.
- Admin frontend: `npm run build` passed.
- Backend booted with local profile command from `backend/`.
- Real Gmail sending was smoke-tested successfully by the user.

## Follow-ups

- Add focused integration tests for order checkout idempotency.
- Add webhook duplicate transaction integration tests for SePay reconciliation.
- Confirm whether SKU uniqueness should be globally unique or product-scoped, then enforce explicitly if needed.
- Add notification preferences per channel later if product scope requires it.
