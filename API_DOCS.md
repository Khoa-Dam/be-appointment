# 📘 API Documentation – Appointment & Scheduling System

Tài liệu này mô tả chi tiết 18 route chính của hệ thống dựa trên source code hiện tại.

---

## 🔐 1. Authentication

### 1.1 Đăng ký
*   **Route**: `POST /auth/register`
*   **Request (Body)**:
    ```json
    {
      "name": "Nguyen Van A",
      "email": "a@gmail.com",
      "password": "123456",
      "phone": "0912345678"
    }
    ```
*   **Response**:
    ```json
    {
      "id": "uuid",
      "email": "a@gmail.com",
      "name": "Nguyen Van A",
      "role": "GUEST",
      "createdAt": "2026-01-25T10:00:00Z"
    }
    ```
*   **Backend**: Tạo user trong Supabase Auth và bảng `users`. Mặc định role là `GUEST`.

### 1.2 Đăng nhập
*   **Route**: `POST /auth/login`
*   **Request (Body)**:
    ```json
    {
      "email": "a@gmail.com",
      "password": "123456"
    }
    ```
*   **Response**:
    ```json
    {
      "accessToken": "jwt-token-string",
      "refreshToken": "refresh-token-string",
      "user": {
          "id": "uuid",
          "email": "a@gmail.com",
          "role": "GUEST",
          "name": "Nguyen Van A"
      }
    }
    ```

---

## 👥 2. User Management (Admin)

### 2.1 Lấy danh sách users
*   **Route**: `GET /users?page=1&limit=20&role=HOST`
*   **Response**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "Host A",
          "email": "host@gmail.com",
          "role": "HOST",
          "is_active": true,
          "created_at": "..."
        }
      ],
      "meta": {
          "total": 10,
          "page": 1,
          "limit": 20,
          "totalPages": 1
      }
    }
    ```

### 2.2 Đổi trạng thái User (Enable/Disable)
*   **Route**: `PATCH /users/:id/status?active=false`
*   **Response**:
    ```json
    {
      "id": "uuid",
      "is_active": false,
      "updated_at": "..."
    }
    ```

---

## 📅 3. Host Availability

### 3.1 Tạo Rule rảnh
*   **Route**: `POST /availability-rules`
*   **Request (Body)**:
    ```json
    {
      "ruleType": "WEEKLY", // WEEKLY, DAILY
      "startHour": 9,
      "endHour": 17,
      "daysOfWeek": "MON,TUE,WED",
      "isActive": true
    }
    ```
*   **Response**:
    ```json
    {
      "id": "uuid",
      "host_id": "uuid",
      "rule_type": "WEEKLY",
      "days_of_week": "MON,TUE,WED",
      "start_hour": 9,
      "end_hour": 17,
      "is_active": true
    }
    ```
*   **Backend**: Tự động nâng cấp user thành HOST nếu chưa phải.

### 3.2 Lấy Rule rảnh của Host
*   **Route**: `GET /availability-rules/:hostId`
*   **Response**:
    ```json
    [
      {
        "id": "uuid",
        "rule_type": "WEEKLY",
        "days_of_week": "MON,TUE",
        "start_hour": 9,
        "end_hour": 17,
        "is_active": true
      }
    ]
    ```

---

## 🕒 4. TimeSlots

### 4.1 Sinh Slot (Generate)
*   **Route**: `POST /timeslots/generate`
*   **Request (Body)**:
    ```json
    {
      "ruleId": "uuid",
      "fromDate": "2026-02-01",
      "toDate": "2026-02-07",
      "slotDuration": 30
    }
    ```
*   **Response**:
    ```json
    {
      "created": 40,
      "message": "TimeSlots generated successfully"
    }
    ```

### 4.2 Xem Slot trống (Guest view detail)
*   **Route**: `GET /timeslots/host/:id` (Lưu ý: Route này dùng ID của Host trên URL)
*   **Response**:
    ```json
    [
      {
        "id": "uuid",
        "hostId": "uuid",
        "date": "2026-02-01",
        "startTime": "2026-02-01T09:00:00.000Z",
        "endTime": "2026-02-01T09:30:00.000Z",
        "startLabel": "09:00",
        "endLabel": "09:30",
        "isAvailable": true
      }
    ]
    ```

### 4.3 Tìm Slot trống (Search filter)
*   **Route**: `GET /timeslots?hostId=xxx`
*   **Response**:
    ```json
    [
      {
        "id": "uuid",
        "startTime": "...",
        "endTime": "...",
        "isAvailable": true
      }
    ]
    ```

---

## 📝 5. Appointments (Booking)

### 5.1 Đặt lịch (Authenticated Guest)
*   **Route**: `POST /appointments`
*   **Request (Body)**:
    ```json
    {
      "hostId": "uuid",
      "timeSlotId": "uuid",
      "reason": "Khám răng"
    }
    ```
*   **Response**:
    ```json
    {
      "id": "uuid",
      "status": "PENDING",
      "hostId": "uuid",
      "guestId": "uuid",
      "reason": "Khám răng",
      "timeSlot": {
          "startTime": "...",
          "endTime": "..."
      },
      "createdAt": "..."
    }
    ```

### 5.2 Đặt lịch (Anonymous Guest)
*   **Route**: `POST /appointments/public`
*   **Request (Body)**:
    ```json
    {
      "hostId": "uuid",
      "timeSlotId": "uuid",
      "reason": "Khám răng",
      "guestName": "Khach A",
      "guestEmail": "khach@gmail.com",
      "guestPhone": "09123"
    }
    ```
*   **Response**: Tương tự 5.1 nhưng `guestId` có thể là `null`.

### 5.3 Lấy lịch hẹn của tôi
*   **Route**: `GET /appointments/my`
*   **Response**:
    ```json
    [
      {
        "id": "uuid",
        "status": "CONFIRMED",
        "reason": "Reason...",
        "timeSlot": {
          "date": "2026-02-01",
          "startTime": "...",
          "endTime": "..."
        },
        "host": { "name": "Host A", "email": "..." },
        "guest": { "name": "Guest B", "email": "..." }
      }
    ]
    ```

### 5.4 Confirm Lịch (Host)
*   **Route**: `PATCH /appointments/:id/confirm`
*   **Response**:
    ```json
    {
      "id": "uuid",
      "status": "CONFIRMED",
      "message": "Appointment confirmed successfully"
    }
    ```
*   **Logic**: Gửi email cho Guest.

### 5.5 Hủy Lịch
*   **Route**: `PATCH /appointments/:id/cancel`
*   **Request**: `{ "cancelReason": "Busy" }`
*   **Response**:
    ```json
    {
      "id": "uuid",
      "status": "CANCELED",
      "cancelReason": "Busy",
      "message": "Appointment canceled successfully"
    }
    ```
*   **Logic**: Mở lại Timeslot (is_available = true).

---

## 🔔 6. Notifications

### 6.1 Lấy thông báo
*   **Route**: `GET /notifications/my`
*   **Response**:
    ```json
    [
      {
        "id": "uuid",
        "type": "APPOINTMENT_CONFIRMED",
        "status": "SENT",
        "sentAt": "..."
      }
    ]
    ```

### 6.2 Gửi thông báo (System/Admin)
*   **Route**: `POST /notifications/send`
*   **Request**:
    ```json
    { "appointmentId": "uuid", "type": "CONFIRMED" }
    ```
*   **Response**: `{ "message": "Notification sent" }`

---

## 📊 7. Reports & Public Data

### 7.1 Thống kê (Admin)
*   **Route**: `GET /reports/appointments`
*   **Response**:
    ```json
    {
      "total": 100,
      "confirmed": 70,
      "canceled": 30
    }
    ```

### 7.2 Lấy danh sách Host (Dành cho Guest)
*   **Route**: `GET /hosts?specialty=Dentist`
*   **Response**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "Dr. A",
          "specialty": "Dentist",
          "description": "...",
          "address": "...",
          "is_active": true
        }
      ],
      "meta": { ... }
    }
    ```

### 7.3 Xem chi tiết Host
*   **Route**: `GET /hosts/:id`
*   **Response**:
    ```json
    {
      "id": "uuid",
      "name": "Dr. A",
      "specialty": "Dentist",
      "availabilityRules": [
        {
          "rule_type": "WEEKLY",
          "days_of_week": "MON,WED",
          "start_hour": 9,
          "end_hour": 17
        }
      ]
    }
    ```

### 7.4 Xem Slot của Host (Guest Detail Flow)
*   **Route**: `GET /timeslots/host/:id`
*   (Đã mô tả ở mục 4.2)
*   **Mục đích**: Dùng cho màn hình chi tiết Host để Guest chọn giờ.

---

## 🚀 8. Additional Routes (Advanced)

### 8.1 Logout
*   **Route**: `POST /auth/logout`
*   **Header**: `Authorization: Bearer <token>`
*   **Response**: `{ "message": "Logged out successfully" }`

### 8.2 Get Check Profile (Me)
*   **Route**: `GET /auth/me`
*   **Header**: `Authorization: Bearer <token>`
*   **Response**:
    ```json
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "HOST",
      "name": "User Name",
      "specialty": "Dental",
      "description": "...",
      "address": "...",
      "is_active": true,
      "created_at": "..."
    }
    ```

### 8.3 Update Rule (Host only)
*   **Route**: `PATCH /availability-rules/:id`
*   **Request**:
    ```json
    {
      "ruleType": "WEEKLY", // Optional
      "startHour": 10,
      "endHour": 16,
      "isActive": false
    }
    ```
*   **Response**: Updated Rule Object.

### 8.4 Delete Rule (Host only)
*   **Route**: `DELETE /availability-rules/:id`
*   **Response**: `{ "message": "Rule deleted successfully" }`

### 8.5 Real-time Notifications (SSE)
*   **Route**: `GET /notifications/sse`
*   **Description**: Server-Sent Events stream for real-time updates.
*   **Usage**: Frontend opens `EventSource` to this URL with Token in query or cookie (Note: standard EventSource doesn't support headers easily, often polyfilled).
