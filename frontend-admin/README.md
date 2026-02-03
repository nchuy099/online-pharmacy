# Frontend Admin

Admin portal cho hệ thống online-pharmacy, viết bằng React + TypeScript + Vite.

## Mục tiêu

- Quản lý user, admin, pharmacist
- Quản lý RBAC, role permission và các màn hình nội bộ
- Điều hướng theo permission thay vì chỉ theo role cứng

## Phân quyền

Ứng dụng dùng token đăng nhập từ backend và lấy thêm quyền hiện tại qua API `/admin/roles/me`.

- `RequireRole` dùng để khóa route theo permission/role
- `RbacPage` cho phép xem và chỉnh sửa mapping permission theo role
- Các quyền quan trọng như `READ_RBAC`, `MANAGE_RBAC`, `READ_USER` được kiểm tra ở client trước khi render màn hình

## Cấu trúc chính

```text
src/
  app/
    layout/
    routers/
  features/
    auth/
    rbac/
    user/
    dashboard/
```

## Chạy local

```bash
cd frontend-admin
npm install
npm run dev
```
