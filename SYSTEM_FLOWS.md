# Hướng dẫn Luồng Hoạt Động (System Workflows)

Tài liệu này tổng hợp toàn bộ các quy trình hoạt động của hệ thống Appointment System.

## 1. Authentication (Đăng ký & Đăng nhập)
Dành cho người dùng muốn tạo tài khoản (để làm Host hoặc Guest lưu lịch sử).

### 1.1 Đăng ký
*   **API**: `POST /auth/register`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "password123",
      "name": "Nguyen Van A",
      "phone": "0912345678"
    }
    ```

### 1.2 Đăng nhập
*   **API**: `POST /auth/login`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
*   **Response**: Trả về `accessToken` và `user` info.

---

## 2. Host Workflow (Người Cung Cấp Dịch Vụ)
Quy trình dành cho Bác sĩ/Chuyên gia để thiết lập lịch làm việc và quản lý hẹn.

### 2.1 Thiết lập Lịch làm việc (Availability Rule)
*Tự động nâng cấp User lên quyền HOST.*
*   **API**: `POST /availability-rules` (Cần Token)
*   **Body**:
    ```json
    {
      "ruleType": "WEEKLY",
      "daysOfWeek": "MON,TUE,WED,THU,FRI",
      "startHour": 8,
      "endHour": 17,
      "specialty": "Nha Khoa",
      "description": "Chuyên niềng răng",
      "address": "123 Đường Láng"
    }
    ```

### 2.2 Sinh các Slot trống (Generate Slots)
Từ Rule trên, tạo ra các khung giờ cụ thể (hàng ngày).
*   **API**: `POST /timeslots/generate` (Cần Token Host)
*   **Body**:
    ```json
    {
      "ruleId": "UUID_CUA_RULE",
      "fromDate": "2026-02-01",
      "toDate": "2026-02-07",
      "slotDuration": 30
    }
    ```

### 2.3 Quản lý & Xác nhận Lịch hẹn
*   **Xem danh sách hẹn**: `GET /appointments/my`
*   **Xác nhận hẹn (Confirm)**:
    *   **API**: `PATCH /appointments/{id}/confirm`
*   **Hủy hẹn (Cancel)**:
    *   **API**: `PATCH /appointments/{id}/cancel`

---

## 3. Guest Workflow (Khách Đã Đăng Nhập)
Dành cho khách hàng có tài khoản, muốn lưu lịch sử khám.

### 3.1 Tìm kiếm Host & Slot
*   **Tìm Host**: `GET /hosts`
*   **Xem giờ rảnh của Host**:
    *   **API**: `GET /timeslots?hostId=UUID_HOST`

### 3.2 Đặt lịch
*   **API**: `POST /appointments` (Cần Token)
*   **Body**:
    ```json
    {
      "hostId": "UUID_HOST",
      "timeSlotId": "UUID_TIMESLOT",
      "reason": "Đau răng hàm dưới"
    }
    ```
*   *Lưu ý*: Không cần nhập tên/email vì hệ thống tự lấy từ tài khoản.

---

## 4. Guest Workflow (Khách Vãng Lai / Ẩn Danh)
Dành cho khách hàng đặt nhanh không cần tạo tài khoản.

### 4.1 Xem giờ rảnh
*   **API**: `GET /timeslots?hostId=UUID_HOST` (API này Public)

### 4.2 Đặt lịch Ẩn danh
*   **API**: `POST /appointments/public` (Không cần Token)
*   **Body**:
    ```json
    {
      "hostId": "UUID_HOST",
      "timeSlotId": "UUID_TIMESLOT",
      "reason": "Tư vấn nhanh",
      "guestName": "Khách Vãng Lai",
      "guestEmail": "khach@gmail.com",
      "guestPhone": "0988888888"
    }
    ```

---

## 5. Quy trình Notification (Tự động)
Hệ thống sẽ tự động xử lý email:
1.  **Khi đặt lịch (Create)**:
    *   Gửi email cho Host: "Có khách mới đặt lịch...".
    *   Gửi email cho Guest: "Bạn đã đặt lịch thành công, vui lòng chờ...".
2.  **Khi Host xác nhận (Confirm)**:
    *   Gửi email cho Guest: "Lịch của bạn đã được xác nhận!".
3.  **Khi Hủy (Cancel)**:
    *   Gửi email thông báo hủy cho phía còn lại.
