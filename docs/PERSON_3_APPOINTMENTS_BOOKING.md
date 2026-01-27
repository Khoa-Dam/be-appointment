# 👤 Person 3: Appointments - Booking

## 📋 Nhiệm Vụ

| # | Route | Method | Auth |
|---|-------|--------|------|
| 9 | `/appointments` | POST | Guest |
| 10 | `/appointments/my` | GET | Auth |

---

## 📁 Files Cần Tạo/Sửa

```
src/appointments/
├── appointments.controller.ts  ← Sửa
├── appointments.service.ts     ← Sửa
├── dto/create-appointment.dto.ts ← Tạo mới
└── entities/appointment.entity.ts ← Tạo mới
```

---

## 🔧 Service Code

```typescript
// appointments.service.ts
async create(guestId: string, dto: CreateAppointmentDto) {
    const client = this.supabase.getClient();

    // 1. ATOMIC: Lock slot
    const { data: slot, error } = await client
        .from('timeslots')
        .update({ is_available: false, booked_by: guestId })
        .eq('id', dto.timeSlotId)
        .eq('is_available', true)  // ⚡ Prevent race condition
        .select().single();

    if (error || !slot) {
        throw new ConflictException('Slot đã được đặt bởi người khác');
    }

    // 2. Create appointment
    const { data: appointment } = await client
        .from('appointments')
        .insert({
            guest_id: guestId,
            host_id: dto.hostId,
            timeslot_id: dto.timeSlotId,
            reason: dto.reason,
            status: 'PENDING',
        })
        .select().single();

    return appointment;
}

async getMyAppointments(userId: string, role: string) {
    const client = this.supabase.getClient();
    
    const column = role === 'HOST' ? 'host_id' : 'guest_id';
    
    const { data } = await client
        .from('appointments')
        .select('*, timeslots(*), users!guest_id(*)')
        .eq(column, userId)
        .order('created_at', { ascending: false });

    return data;
}
```

---

## 📝 DTO

```typescript
// dto/create-appointment.dto.ts
export class CreateAppointmentDto {
    @IsUUID()
    hostId: string;

    @IsUUID()
    timeSlotId: string;

    @IsOptional()
    @IsString()
    reason?: string;
}
```

---

## ✅ Checklist

- [ ] Tạo `dto/create-appointment.dto.ts`
- [ ] Tạo `entities/appointment.entity.ts`
- [ ] Implement `create()` với race condition prevention
- [ ] Implement `getMyAppointments()`
- [ ] Test Swagger
