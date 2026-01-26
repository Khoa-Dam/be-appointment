# 🎯 Task Distribution - 3 Developers

## 📋 Overview

- **Person A**: Auth & User Management (7 routes)
- **Person B**: Appointments & Notifications (7 routes)
- **Person C**: Availability & TimeSlots (4 routes)

---

## 👤 Person A - Auth & User Management

### Modules: `auth/`, `users/`, `reports/`

### Tasks

#### 1. Auth Module (`src/auth/`)

**Route 1: POST /auth/register**
- File: `auth.controller.ts`
- DTO: `dto/register.dto.ts`
- Service method: `authService.register()`
- Response: User object + createdAt

**Route 2: POST /auth/login**
- File: `auth.controller.ts`
- DTO: `dto/login.dto.ts`
- Service method: `authService.login()`
- Response: JWT token + user info

**Checklist:**
- [ ] Create `register.dto.ts` với validation
- [ ] Create `login.dto.ts`
- [ ] Implement `authService.register()` - Supabase signup
- [ ] Implement `authService.login()` - Supabase signin
- [ ] Add routes trong `auth.controller.ts`
- [ ] Test với Postman/cURL

---

#### 2. Users Module (`src/users/`)

**Route 3: GET /users**
- Controller: `@Get('users')` + `@Roles('ADMIN')`
- Service: `usersService.findAll()`
- Response: Array of users

**Route 4: PATCH /users/:id/disable**
- Controller: `@Patch('users/:id/disable')` + `@Roles('ADMIN')`
- DTO: `dto/update-user.dto.ts`
- Service: `usersService.disableUser(id)`

**Route 16: GET /hosts**
- Controller: `@Get('hosts')`
- Query: `?specialty=xxx`
- Service: `usersService.findHosts(specialty?)`

**Route 17: GET /hosts/:id**
- Controller: `@Get('hosts/:id')`
- Service: `usersService.findHostById(id)` (include availability rules)

**Checklist:**
- [ ] Create `update-user.dto.ts`
- [ ] Implement all service methods
- [ ] Add routes with guards
- [ ] Test admin routes with JWT
- [ ] Test host listing/detail

---

#### 3. Reports Module (`src/reports/`)

**Route 15: GET /reports/appointments**
- Controller: `@Get('appointments')` + `@Roles('ADMIN')`
- Service: `reportsService.getAppointmentStatistics()`
- Response: `{ total, confirmed, canceled }`

**Checklist:**
- [ ] Implement aggregation query
- [ ] Add route with Admin guard
- [ ] Test statistics

---

### Dependencies
- Supabase auth API
- Users table queries
- Appointments table aggregation

### Estimated Time: 2-3 days
### Priority: HIGH (Foundation for other modules)

---

## 👤 Person B - Appointments & Notifications

### Modules: `appointments/`, `notifications/`

### Tasks

#### 1. Appointments Module (`src/appointments/`)

**Route 9: POST /appointments**
- Controller: `@Post()` + `@UseGuards(SupabaseGuard)`
- DTO: `dto/create-appointment.dto.ts`
- Service: `appointmentsService.create()`
- Logic: Lock timeslot, create appointment, send notification

**Route 10: GET /appointments/my**
- Controller: `@Get('my')` + `@UseGuards(SupabaseGuard)`
- Service: `appointmentsService.findMyAppointments(userId)`
- Response: Array with timeslot details

**Route 11: PATCH /appointments/:id/confirm**
- Controller: `@Patch(':id/confirm')` + `@Roles('HOST')`
- Service: `appointmentsService.confirm(id, hostId)`
- Logic: Update status = CONFIRMED, send notification

**Route 12: PATCH /appointments/:id/cancel**
- Controller: `@Patch(':id/cancel')`
- DTO: `dto/cancel-appointment.dto.ts`
- Service: `appointmentsService.cancel(id, userId, reason)`
- Logic: Update status = CANCELED, unlock timeslot, send notification

**Checklist:**
- [ ] Create `create-appointment.dto.ts`
- [ ] Create `cancel-appointment.dto.ts`
- [ ] Implement create with timeslot locking
- [ ] Implement confirm logic
- [ ] Implement cancel logic with unlock
- [ ] Integrate with NotificationsService
- [ ] Test full booking flow

---

#### 2. Notifications Module (`src/notifications/`)

**Route 13: GET /notifications/my**
- Controller: `@Get('my')` + `@UseGuards(SupabaseGuard)`
- Service: `notificationsService.findMyNotifications(userId)`

**Route 14: POST /notifications/send**
- Controller: `@Post('send')` (internal/admin only)
- DTO: `dto/create-notification.dto.ts`
- Service: `notificationsService.sendNotification()`

**Route 18: GET /hosts/:id/timeslots** (Bonus)
- Actually in UsersController but uses TimeslotsService
- Controller: `@Get('hosts/:id/timeslots')` in users module
- Service: Inject TimeslotsService

**Checklist:**
- [ ] Create notification DTOs
- [ ] Implement find my notifications
- [ ] Implement send notification
- [ ] Add auto-notification on appointment actions
- [ ] Test notification flow

---

### Dependencies
- TimeslotsService (for locking/unlocking)
- NotificationsService (trigger on actions)

### Estimated Time: 3-4 days
### Priority: MEDIUM (Depends on Person C's timeslots)

---

## 👤 Person C - Availability & TimeSlots

### Modules: `availability-rules/`, `timeslots/`

### Tasks

#### 1. Availability Rules Module (`src/availability-rules/`)

**Route 5: POST /availability-rules**
- Controller: `@Post()` + `@Roles('HOST')`
- DTO: `dto/create-availability-rule.dto.ts`
- Service: `availabilityRulesService.create(hostId, data)`

**Route 6: GET /availability-rules/:hostId**
- Controller: `@Get(':hostId')`
- Service: `availabilityRulesService.findByHostId(hostId)`

**Checklist:**
- [ ] Create `create-availability-rule.dto.ts` with validation
- [ ] Create `update-availability-rule.dto.ts`
- [ ] Implement CRUD service methods
- [ ] Add routes with guards
- [ ] Test rule creation

---

#### 2. TimeSlots Module (`src/timeslots/`)

**Route 7: POST /timeslots/generate**
- Controller: `@Post('generate')` + `@Roles('HOST')`
- DTO: `dto/create-timeslot.dto.ts`
- Service: `timeslotsService.generateSlots()`
- Logic: Read availability rule, generate slots based on duration

**Route 8: GET /timeslots?hostId=xxx**
- Controller: `@Get()`
- Query: `dto/query-timeslots.dto.ts`
- Service: `timeslotsService.findAvailableSlots(hostId)`
- Response: Only `isAvailable = true` slots

**Checklist:**
- [ ] Create DTOs
- [ ] Implement slot generation algorithm
```typescript
// Pseudo-code
for each day in [fromDate, toDate]:
  if day matches rule.daysOfWeek:
    for each slot in [startHour, endHour] step slotDuration:
      create timeslot
```
- [ ] Implement query with filters
- [ ] Export `lockSlot()` and `unlockSlot()` methods
- [ ] Test generation logic
- [ ] Test querying available slots

---

### Dependencies
- AvailabilityRulesService (read rules to generate)

### Estimated Time: 2-3 days
### Priority: HIGH (Person B depends on this)

---

## 🔄 Integration Flow

```
Day 1-2: Setup & Foundation
  Person C: Availability Rules + TimeSlot generation
  Person A: Auth (register, login)
  Person B: Entities & DTOs setup

Day 3-4: Core Features
  Person A: Users management + Host listing
  Person C: TimeSlot queries + locking mechanism
  Person B: Appointment creation

Day 5-6: Integration
  Person B: Appointment confirm/cancel + Notifications
  Person A: Reports/statistics
  All: Integration testing

Day 7: Polish & Testing
  All: Bug fixes, testing, documentation
```

---

## 📝 Shared Resources

### Common Files (DO NOT modify simultaneously)
- `src/common/enums/` ✅ Already done
- `src/common/interfaces/` ✅ Already done
- `src/common/decorators/` ✅ Already done
- `src/common/guards/` ✅ Already done

### Database Schema
- `supabase/migrations/` ✅ Already done
- RLS policies ✅ Already done

---

## 🎯 Git Workflow

### Branch Strategy
```bash
# Person A
git checkout -b feature/auth-users
git checkout -b feature/reports

# Person B  
git checkout -b feature/appointments
git checkout -b feature/notifications

# Person C
git checkout -b feature/availability
git checkout -b feature/timeslots
```

### Merge Order
1. Person C → `main` (availability, timeslots)
2. Person A → `main` (auth, users)
3. Person B → `main` (appointments, notifications)

---

## ✅ Definition of Done

Each person must ensure:
- [ ] All DTOs have validation decorators
- [ ] All services have error handling
- [ ] All routes have proper guards
- [ ] Code compiles without errors
- [ ] Manual testing done with Postman
- [ ] Git commit với meaningful messages

---

## 🚀 Ready to Start!

Cấu trúc đã sẵn sàng. Mỗi người clone repo và checkout branch riêng để bắt đầu!
