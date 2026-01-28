# CHƯƠNG 5. KIỂM THỬ VÀ ĐÁNH GIÁ HỆ THỐNG

## 5.1. Tổng quan về Kiểm thử phần mềm

### 5.1.1. Mục tiêu và Phạm vi
Kiểm thử phần mềm (Software Testing) là giai đoạn quan trọng nhằm đảm bảo sản phẩm đáp ứng các yêu cầu chất lượng trước khi triển khai. Mục tiêu của giai đoạn này bao gồm:
1.  **Xác minh (Verification)**: Đảm bảo hệ thống được xây dựng đúng theo thiết kế và không có lỗi logic.
2.  **Thẩm định (Validation)**: Đảm bảo hệ thống đáp ứng đúng nhu cầu nghiệp vụ của người dùng cuối (Guest/Host).
3.  **Đánh giá chất lượng**: Đo lường các chỉ số về hiệu năng, bảo mật và độ tin cậy.

**Phạm vi kiểm thử**:
*   Kiểm thử chức năng (Functional Testing) cho 18 API endpoints.
*   Kiểm thử tích hợp (Integration Testing) cho các luồng nghiệp vụ chính.
*   Kiểm thử bảo mật (Security Testing) đối với phân quyền (Role-based Access Control).

### 5.1.2. Chiến lược và Phương pháp luận
Áp dụng mô hình **Kim tự tháp kiểm thử (Testing Pyramid)** kết hợp với tiêu chuẩn **IEEE 829** về tài liệu kiểm thử:

*   **Kiểm thử hộp trắng (White-box Testing)**:
    *   **Mức độ**: Unit Test (Kiểm thử đơn vị).
    *   **Đối tượng**: Các hàm xử lý logic phức tạp trong `AppointmentsService`.
    *   **Kỹ thuật**: Sử dụng Mock Object để cô lập các phụ thuộc (Database, Email Service).
*   **Kiểm thử hộp đen (Black-box Testing)**:
    *   **Mức độ**: E2E Test (Kiểm thử chấp nhận hệ thống).
    *   **Đối tượng**: Toàn bộ hệ thống API.
    *   **Kỹ thuật**: Giả lập hành vi người dùng thực tế từ client (HTTP Requests) để kiểm tra đầu vào/đầu ra.

---

## 5.2. Môi trường và Công cụ thực nghiệm

### 5.2.1. Cấu hình môi trường (Test Environment)
| Thành phần | Chi tiết kỹ thuật | Ghi chú |
| :--- | :--- | :--- |
| **Hardware** | PC Core i5/i7, RAM 16GB | Môi trường phát triển cục bộ |
| **OS** | Linux (Ubuntu 22.04 / WSL2) | Hệ điều hành máy chủ giả lập |
| **Runtime** | Node.js v18.x (LTS) | Môi trường thực thi JavaScript |
| **Database** | Supabase (PostgreSQL 15) | Database test riêng biệt (Sandbox) |
| **Package Manager**| PNPM v9.x | Quản lý thư viện tối ưu hóa |

### 5.2.2. Bộ công cụ kiểm thử (Toolchain)
1.  **Jest**: Test Runner chính, cung cấp môi trường thực thi, Assertions và Code Coverage report.
2.  **Supertest**: Thư viện giả lập HTTP Agent, cho phép gửi request trực tiếp đến ̣ứng dụng NestJS mà không cần khởi động server vật lý trên port thực.
3.  **Ts-jest**: Preprocessor giúp chạy code TypeScript trực tiếp trong môi trường test.

---

## 5.3. Thiết kế ca kiểm thử (Test Design)

### 5.3.1. Ma trận truy vết yêu cầu (Requirement Traceability Matrix)
Bảng ánh xạ giữa Yêu cầu phần mềm (Requirements) và Ca kiểm thử (Test Cases) để đảm bảo độ bao phủ:

| Mã Yêu cầu (Req ID) | Mô tả Yêu cầu | Mã Test Case (TC ID) | Loại kiểm thử |
| :--- | :--- | :--- | :--- |
| **REQ_AUTH_01** | Đăng ký tài khoản (Host/Guest) | TC_01, TC_05 | Functional |
| **REQ_AUTH_02** | Đăng nhập hệ thống | TC_02, TC_06 | Functional |
| **REQ_AUTH_03** | Bảo mật đăng nhập | TC_12 | Security (Negative) |
| **REQ_CORE_01** | Thiết lập lịch rảnh (Host) | TC_03, TC_04 | Functional |
| **REQ_CORE_02** | Tìm kiếm bác sĩ (Guest) | TC_07 | Functional |
| **REQ_BOOK_01** | Đặt lịch hẹn | TC_09 | Functional |
| **REQ_BOOK_02** | Ngăn chặn trùng lịch | TC_14 | Validation (Negative) |
| **REQ_BOOK_03** | Hủy/Duyệt lịch | TC_10, TC_15 | Functional |
| **REQ_SEC_01** | Phân quyền truy cập | TC_13 | Security (RBAC) |

### 5.3.2. Mô tả chi tiết các nhóm Test Case
Bộ kiểm thử tự động (`test/app.e2e-spec.ts`) bao gồm 4 nhóm chính:
1.  **Group 1: Authentication & Setup**: Kiểm tra luồng khởi tạo dữ liệu nền tảng.
2.  **Group 2: Guest Actions**: Kiểm tra luồng tương tác của người dùng cuối.
3.  **Group 3: Transactional Flows**: Kiểm tra các nghiệp vụ thay đổi trạng thái (Confirm, Cancel) và tác động phụ (Notification).
4.  **Group 4: Edge Cases**: Kiểm tra khả năng chịu lỗi của hệ thống (Sai password, Spam API, Race condition).

---

## 5.4. Kết quả thực nghiệm (Test Results Analysis)

### 5.4.1. Thống kê kết quả (Test Summary Report)
Thực hiện chạy lệnh `pnpm test:e2e` vào ngày 28/01/2026.

| Nhóm Test Case | Tổng số | Đạt (Pass) | Trượt (Fail) | Tỷ lệ đạt |
| :--- | :---: | :---: | :---: | :---: |
| Auth & Setup | 4 | 4 | 0 | 100% |
| Guest Actions | 5 | 5 | 0 | 100% |
| Confirmation | 2 | 2 | 0 | 100% |
| Cancellation | 3 | 3 | 0 | 100% |
| Edge Cases | 3 | 3 | 0 | 100% |
| **TỔNG CỘNG** | **17** | **17** | **0** | **100%** |

### 5.4.2. Báo cáo độ bao phủ mã nguồn (Code Coverage Analysis)
Dựa trên kết quả từ `pnpm test:cov`:

| File/Module | Độ bao phủ câu lệnh (Stmts) | Đánh giá |
| :--- | :---: | :--- |
| **appointments.service.ts** | 100% | **Xuất sắc**: Core logic được test kỹ lưỡng. |
| **users.service.ts** | 30% | **Trung bình**: Chủ yếu là hàm CRUD đơn giản, đã được cover gián tiếp qua E2E. |
| **availability-rules** | 38% | **Trung bình**: Logic sinh slot đã được test kỹ ở E2E test. |

*Nhận xét: Vì dự án tập trung vào E2E Testing (kiểm thử hành vi) nên độ bao phủ Unit Test ở một số module CRUD thấp là điều nằm trong kế hoạch tối ưu nguồn lực.*

---

## 5.5. Đánh giá chất lượng hệ thống (Quality Evaluation)

Dựa trên tiêu chuẩn **ISO/IEC 25010**, hệ thống được đánh giá như sau:

### 5.5.1. Tính phù hợp chức năng (Functional Suitability)
*   **Đánh giá**: **Đạt**.
*   **Minh chứng**: 100% các yêu cầu nghiệp vụ từ Đăng ký, Đặt lịch đến Hủy lịch đều hoạt động chính xác theo kịch bản kiểm thử.

### 5.5.2. Tính bảo mật (Security)
*   **Đánh giá**: **Khá**.
*   **Minh chứng**:
    *   Cơ chế Authentication (JWT) hoạt động tốt (TC_12).
    *   Cơ chế Authorization (RBAC) ngăn chặn hiệu quả Guest thực hiện hành vi của Host (TC_13).
    *   Dữ liệu được bảo vệ 2 lớp (Metadata Authorization + RLS Database).

### 5.5.3. Độ tin cậy (Reliability)
*   **Đánh giá**: **Tốt**.
*   **Minh chứng**: Hệ thống xử lý tốt các ngoại lệ (Exception Handling) và đảm bảo tính toàn vẹn dữ liệu khi có xung đột (TC_14 Double Booking).

### 5.5.4. Hạn chế tồn đọng (Limitations)
1.  **Hiệu năng chịu tải**: Chưa có số liệu Stress Test với lượng người dùng lớn (>1000 CCU).
2.  **Khả năng bảo trì Unit Test**: Do phụ thuộc nhiều vào E2E Test, việc refactor code nhỏ có thể ít được bảo vệ bởi Unit Test ở cấp độ hàm.

---

## 5.6. Kết luận chương
Quá trình kiểm thử cho thấy hệ thống **Appointment Booking** đã đạt mức độ hoàn thiện cao về mặt chức năng và logic nghiệp vụ. Việc áp dụng quy trình kiểm thử tự động (Automated Testing) giúp đảm bảo tính ổn định của sản phẩm và tạo tiền đề vững chắc cho các giai đoạn phát triển mở rộng tiếp theo.
