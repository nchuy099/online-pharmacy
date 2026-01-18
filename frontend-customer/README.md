# Frontend Customer

Customer storefront cho hệ thống online-pharmacy, viết bằng React + TypeScript + Vite.

## Mục tiêu

- Trang chủ và trang sản phẩm
- Tài khoản người dùng, đơn hàng, thanh toán, hồ sơ sức khỏe
- Chat tư vấn và gợi ý sản phẩm

## Auth và permission

Ứng dụng lấy access token từ backend và hydrate thêm quyền hiện tại khi khởi tạo phiên.

- `RequireAuth` khóa các route theo permission
- `AuthContext` lưu `accessToken`, `refreshToken`, `user` và danh sách permission
- Chat AI và recommendation gọi API backend theo flow mới sau khi service nội bộ được bảo vệ bằng JWT

## Cấu trúc chính

```text
src/
  app/
  features/
    auth/
    cart/
    chat/
    home/
    order/
    recommendation/
    user/
```

## Chạy local

```bash
cd frontend-customer
npm install
npm run dev
```

