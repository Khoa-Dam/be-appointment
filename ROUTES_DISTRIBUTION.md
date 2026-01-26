# 🎯 Phân Chia 18 Routes - 3 Người (7-7-4)

## 👤 Person A - Auth & User Management (7 routes)

### Auth
1. **POST /auth/register** - Đăng ký
2. **POST /auth/login** - Đăng nhập

### User Management (Admin)
3. **GET /users** - Danh sách users (Admin)
4. **PATCH /users/:id/disable** - Khóa user (Admin)
5. **GET /reports/appointments** - Thống kê (Admin)

### Host Discovery (Guest)
16. **GET /hosts** - Danh sách hosts
17. **GET /hosts/:id** - Chi tiết host

**Modules cần tạo:**
- `auth/` (register, login)
- `users/` (list, disable)
- `reports/` (statistics)
- `hosts/` (list, detail) - hoặc dùng UsersModule

---

## 👤 Person B - Appointments & Notifications (7 routes)

### Appointment Management
9. **POST /appointments** - Đặt lịch (Guest)
10. **GET /appointments/my** - Lịch của tôi
11. **PATCH /appointments/:id/confirm** - Xác nhận (Host)
12. **PATCH /appointments/:id/cancel** - Hủy lịch

### Notifications
13. **GET /notifications/my** - Thông báo của tôi
14. **POST /notifications/send** - Gửi thông báo (System)

### TimeSlots cho Appointment
18. **GET /hosts/:id/timeslots** - Lấy slots của host (cho booking flow)

**Modules cần tạo:**
- `appointments/` (create, confirm, cancel, my)
- `notifications/` (list, send)

---

## 👤 Person C - Availability & TimeSlots (4 routes)

### Availability Rules (Host)
5. **POST /availability-rules** - Tạo rule thời gian rảnh
6. **GET /availability-rules/:hostId** - Xem rules của host

### TimeSlot Generation (Host)
7. **POST /timeslots/generate** - Sinh slots từ rules
8. **GET /timeslots?hostId=xxx** - Lấy slots available

**Modules cần tạo:**
- `availability-rules/` (create, get)
- `timeslots/` (generate, query)

---

## 📋 Module Summary

| Person | Modules | Routes | Độ khó |
|--------|---------|--------|--------|
| **A** | auth, users, reports | 7 | ⭐⭐ Medium |
| **B** | appointments, notifications | 7 | ⭐⭐⭐ Hard |
| **C** | availability-rules, timeslots | 4 | ⭐⭐⭐ Hard |

---

## 🔄 Dependencies

```
Person C → Person A → Person B

Person C làm trước:
  availability-rules (Host setup schedule)
  timeslots (Generate slots)
    ↓
Person A:
  auth (Users can login)
  users (Manage users)
  hosts (List & view hosts)
    ↓
Person B:
  appointments (Book using slots & users)
  notifications (Notify users)
```

---

## ✅ Checklist Timeline

### Week 1 - Foundations
- [ ] Person C: Availability Rules + TimeSlot entities/DTOs
- [ ] Person A: Auth (register/login)
- [ ] Person B: Appointments entities/DTOs

### Week 2 - Core Features
- [ ] Person C: TimeSlot generation logic
- [ ] Person A: User management + Host listing
- [ ] Person B: Appointment booking flow

### Week 3 - Integration
- [ ] Person C: TimeSlot queries optimization
- [ ] Person A: Reports/statistics
- [ ] Person B: Notifications system

### Week 4 - Testing & Polish
- [ ] Integration testing
- [ ] Bug fixes
- [ ] Documentation

---

## 🎯 Recommended Order

**Tuần 1:**
1. Person C setup availability system
2. Person A setup authentication
3. Person B chuẩn bị entities

**Tuần 2-3:**
- Parallel development
- Daily sync để check integration

**Tuần 4:**
- Merge & test together
