# Tài Liệu API Tư Vấn & Quản Lý Bệnh Nhân

Tài liệu này tổng hợp các endpoint mới và cập nhật cho module Tư vấn và Quản lý bệnh nhân/người thân.

**Base URL:** `/` (hoặc tiền tổ tương ứng trên Backend)

---

## 1. Quản Lý Bệnh Nhân (Hồ sơ người thân)

Toàn bộ thông tin bệnh nhân (chủ tài khoản và người thân) được quản lý qua các endpoint `/patients/me/`.

### 1.1 Danh sách hồ sơ
**Endpoint:** `GET /patients/me/list`
**Mô tả:** Lấy danh sách tất cả các hồ sơ y tế liên kết với tài khoản hiện tại.
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pat-001",
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0901234567",
      "isPrimary": true,
      "relationship": "Bản thân",
      "gender": "MALE",
      "dateOfBirth": "1990-01-01"
    },
    {
      "id": "pat-002",
      "fullName": "Nguyễn Văn B",
      "phoneNumber": "0907654321",
      "isPrimary": false,
      "relationship": "Con cái",
      "gender": "FEMALE",
      "dateOfBirth": "2015-05-20"
    }
  ]
}
```

### 1.2 Thêm hồ sơ người thân
**Endpoint:** `POST /patients/me/create`
**Body:**
```json
{
  "fullName": "Nguyễn Văn B",
  "phoneNumber": "0907654321",
  "email": "b@example.com", // Optional
  "gender": "FEMALE", // MALE | FEMALE | OTHER
  "dateOfBirth": "2015-05-20",
  "relationship": "Con cái"
}
```

### 1.3 Cập nhật hồ sơ
**Endpoint:** `PUT /patients/me/update/{id}`
**Mô tả:** Cập nhật thông tin chi tiết một hồ sơ.

### 1.4 Xóa hồ sơ
**Endpoint:** `DELETE /patients/me/delete/{id}`

---

## 2. Hệ Thống Đặt Lịch (Consultation)

### 2.1 Lấy danh sách Chuyên khoa/Dược sĩ
**Endpoint:** `GET /consultations/service?type={SPECIALIST|PHARMACIST}`
**Response (Dược sĩ):**
```json
[
  {
    "id": "pharm-1",
    "name": "Pharmacist Huy",
    "description": "Expert in cardiovascular medications."
  }
]
```

### 2.2 Tạo lịch hẹn mới (Cập nhật)
**Endpoint:** `POST /consultations/create`
**Mô tả:** Sử dụng `patientId` để liên kết lịch hẹn với hồ sơ bệnh nhân.
**Body:**
```json
{
  "targetType": "SPECIALIST",
  "serviceId": "spec-1",
  "serviceCode": "DERMATOLOGY",
  "date": "2026-02-22",
  "reason": "Mô tả triệu chứng...",
  "patientId": "pat-001", // ID từ danh sách /patients/me/list
  "paymentMethod": "COD" // COD | VN_PAY
}
```

### 2.3 Tra cứu lịch hẹn
**Endpoint:** `GET /consultations/search?query={id/phone/email}`
**Response:**
```json
{
  "data": [
    {
      "id": "SMART-2026-0001",
      "status": "Confirmed",
      "patient": {
         "fullName": "Nguyễn Văn A",
         "phoneNumber": "0901234567"
      },
      "serviceCode": "DERMATOLOGY",
      "date": "2026-02-22"
    }
  ]
}
```

---

## 3. Quy trình OTP & Hủy lịch

1. **Yêu cầu OTP:** `POST /consultations/send-otp` (Gửi qua email của bệnh nhân)
2. **Xác thực & Hủy:** `POST /consultations/verify-cancel` (`id`, `otp`)
3. **Hủy trực tiếp:** `POST /consultations/cancel` (`id`)
