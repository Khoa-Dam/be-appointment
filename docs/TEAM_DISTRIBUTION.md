# 📋 Phân Chia Công Việc - 5 Người - 12 Routes

## ⚡ QUAN TRỌNG: Làm Song Song (1 đêm)

> Tất cả 5 người code **cùng lúc**, không đợi nhau. Mỗi người làm trong **module riêng** → **không conflict git**.

## 📊 Tổng Quan

| Người | Module | Routes | Chi tiết |
|-------|--------|--------|----------|
| **Person 1** | `availability-rules/` | 2 | `#5 POST /availability-rules`, `#6 GET /availability-rules/:hostId` |
| **Person 2** | `timeslots/` | 3 | `#7 POST /timeslots/generate`, `#8 GET /timeslots`, `#18 GET /hosts/:id/timeslots` |
| **Person 3** | `appointments/` | 2 | `#9 POST /appointments`, `#10 GET /appointments/my` |
| **Person 4** | `appointments/` | 2 | `#11 PATCH /appointments/:id/confirm`, `#12 PATCH /appointments/:id/cancel` |
| **Person 5** | `notifications/` + `reports/` | 3 | `#13 GET /notifications/my`, `#14 POST /notifications/send`, `#15 GET /reports/appointments` |

---

## 🎯 Cách Làm Song Song Không Conflict

### Person 3 & 4 (cùng module appointments):
```bash
# P3 viết TRƯỚC các methods:
- createAppointment()
- getMyAppointments()

# P4 viết SAU (thêm vào cuối file):
- confirmAppointment()
- cancelAppointment()

# Merge: P3 merge trước → P4 pull → P4 thêm code → P4 merge
```

### Tất cả người khác:
- Làm độc lập trong module riêng
- Không cần đợi ai

---

## 📁 Git Branch (Làm Song Song)

```bash
# Tất cả tạo branch CÙNG LÚC
git checkout -b feature/availability-rules   # P1
git checkout -b feature/timeslots            # P2
git checkout -b feature/appointments-booking # P3
git checkout -b feature/appointments-actions # P4
git checkout -b feature/notifications        # P5
```

---

## 🕐 Timeline (1 Đêm)

| Giờ | Tất cả 5 người |
|-----|----------------|
| 18:00 - 20:00 | Tạo Entity + DTO |
| 20:00 - 23:00 | Implement Service + Controller |
| 23:00 - 24:00 | Test Swagger local |
| 00:00 - 01:00 | **Merge theo thứ tự** |
| 01:00 - 02:00 | Fix conflicts (nếu có) |

**Merge Order:**
1. P1 (availability-rules) → main
2. P5 (notifications, reports) → main
3. P2 (timeslots) → main
4. P3 (appointments booking) → main
5. P4 (appointments actions) → main ← cuối cùng

---

## 📖 Chi Tiết Từng Người

- [PERSON_1_AVAILABILITY_RULES.md](./PERSON_1_AVAILABILITY_RULES.md)
- [PERSON_2_TIMESLOTS.md](./PERSON_2_TIMESLOTS.md)
- [PERSON_3_APPOINTMENTS_BOOKING.md](./PERSON_3_APPOINTMENTS_BOOKING.md)
- [PERSON_4_APPOINTMENTS_ACTIONS.md](./PERSON_4_APPOINTMENTS_ACTIONS.md)
- [PERSON_5_NOTIFICATIONS_REPORTS.md](./PERSON_5_NOTIFICATIONS_REPORTS.md)

---

## ⚙️ Database Schema Reference

```sql
-- availability_rules
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id),
  rule_type VARCHAR(20) DEFAULT 'WEEKLY',
  days_of_week VARCHAR(50), -- 'MON,TUE,WED'
  start_hour INTEGER,
  end_hour INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- timeslots
CREATE TABLE timeslots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id),
  rule_id UUID REFERENCES availability_rules(id),
  date DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_available BOOLEAN DEFAULT true,
  booked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID REFERENCES users(id),
  host_id UUID REFERENCES users(id),
  timeslot_id UUID REFERENCES timeslots(id),
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELED, COMPLETED
  reason TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  type VARCHAR(50), -- APPOINTMENT_CREATED, CONFIRMED, CANCELED, REMINDER
  message TEXT,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, READ
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎯 Checklist Tổng

- [ ] Person 1: Availability Rules (2 routes)
- [ ] Person 2: TimeSlots (3 routes)
- [ ] Person 3: Appointments Booking (2 routes)
- [ ] Person 4: Appointments Actions (2 routes)
- [ ] Person 5: Notifications + Reports (3 routes)
- [ ] Integration Testing
- [ ] Final Merge to main
