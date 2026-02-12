# Frontend Pharmacist

Pharmacist portal cho hệ thống online-pharmacy, viết bằng React + TypeScript + Vite.

## Mục tiêu

- Đăng nhập dược sĩ
- Quản lý phiên chat với khách hàng
- Truy cập các màn hình nội bộ theo permission

## Auth và route guard

- `AuthContext` lưu trạng thái đăng nhập và permission của dược sĩ
- `PrivateRoute` chặn truy cập nếu chưa đăng nhập
- `RequirePermission` chặn route theo permission như `PHARMACIST_CHAT_MANAGE`

## Cấu trúc chính

```text
src/
  app/
    routers/
  features/
    auth/
    chat/
    profile/
```

## Chạy local

```bash
cd frontend-pharmacist
npm install
npm run dev
```

