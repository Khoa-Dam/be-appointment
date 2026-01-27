# 👤 Person 4: Appointments - Actions

## 📋 Nhiệm Vụ

| # | Route | Method | Auth |
|---|-------|--------|------|
| 11 | `/appointments/:id/confirm` | PATCH | Host |
| 12 | `/appointments/:id/cancel` | PATCH | Guest/Host |

---

## 📁 Files Cần Sửa

```
src/appointments/
├── appointments.controller.ts  ← Thêm routes
├── appointments.service.ts     ← Thêm methods
└── dto/cancel-appointment.dto.ts ← Tạo mới
```

> ⚠️ **Chờ Person 3 merge xong rồi mới bắt đầu**

---

## 🔧 Service Code

```typescript
// Thêm vào appointments.service.ts

async confirm(appointmentId: string, hostId: string) {
    const client = this.supabase.getClient();

    // Verify host owns this appointment
    const { data, error } = await client
        .from('appointments')
        .update({ status: 'CONFIRMED', updated_at: new Date() })
        .eq('id', appointmentId)
        .eq('host_id', hostId)
        .eq('status', 'PENDING')  // Chỉ confirm nếu đang PENDING
        .select().single();

    if (error || !data) {
        throw new BadRequestException('Cannot confirm this appointment');
    }

    // TODO: Trigger notification
    return data;
}

async cancel(appointmentId: string, userId: string, reason?: string) {
    const client = this.supabase.getClient();

    // 1. Get appointment
    const { data: appt } = await client
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

    // 2. Check permission (guest or host)
    if (appt.guest_id !== userId && appt.host_id !== userId) {
        throw new ForbiddenException('Not your appointment');
    }

    // 3. Update status
    const { data } = await client
        .from('appointments')
        .update({ 
            status: 'CANCELED', 
            cancel_reason: reason,
            updated_at: new Date() 
        })
        .eq('id', appointmentId)
        .select().single();

    // 4. Release timeslot
    await client
        .from('timeslots')
        .update({ is_available: true, booked_by: null })
        .eq('id', appt.timeslot_id);

    return data;
}
```

---

## 📝 DTO

```typescript
// dto/cancel-appointment.dto.ts
export class CancelAppointmentDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    cancelReason?: string;
}
```

---

## ✅ Checklist

- [ ] Git pull từ main (sau Person 3 merge)
- [ ] Tạo `dto/cancel-appointment.dto.ts`
- [ ] Implement `confirm()`
- [ ] Implement `cancel()` với release slot
- [ ] Thêm routes vào Controller
- [ ] Test Swagger
