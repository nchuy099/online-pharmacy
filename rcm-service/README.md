# RCM Service

Recommendation service cho hệ thống online-pharmacy, viết bằng FastAPI.

## Mục tiêu

- Trả về gợi ý sản phẩm cho trang chủ và trang chi tiết
- Kết hợp content-based, item-based CF và trending
- Chỉ cho phép request nội bộ từ backend qua JWT nội bộ

## API

Base prefix: `/api/v1`

- `GET /api/v1/recommendations`
- `GET /api/v1/recommendations/trending`
- `GET /health`

`/api/v1/recommendations*` yêu cầu `Authorization: Bearer <internal-jwt>`.
JWT phải khớp các biến môi trường:

- `RCM_INTERNAL_JWT_SECRET`
- `RCM_INTERNAL_JWT_ISSUER`
- `RCM_INTERNAL_JWT_AUDIENCE`

## Luồng chạy

- Backend tạo internal JWT khi gọi RCM
- `rcm-service` verify chữ ký, `iss`, `aud`, `exp`
- Nếu hợp lệ thì service trả recommendation response

## Cấu trúc code

```text
app/
  api/
  domain/
  infrastructure/
  use_cases/
  security/
```

## Chạy local

```bash
cd rcm-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

