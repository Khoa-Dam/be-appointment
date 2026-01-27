# 👤 Person 5: Notifications + Reports

## 📋 Nhiệm Vụ

| # | Route | Method | Auth |
|---|-------|--------|------|
| 13 | `/notifications/my` | GET | Auth |
| 14 | `/notifications/send` | POST | System/Admin |
| 15 | `/reports/appointments` | GET | Admin |

---

## 📁 Files Cần Tạo/Sửa

```
src/notifications/
├── notifications.controller.ts  ← Sửa
├── notifications.service.ts     ← Sửa
├── dto/send-notification.dto.ts ← Tạo mới
└── entities/notification.entity.ts ← Tạo mới

src/reports/
├── reports.controller.ts  ← Sửa
└── reports.service.ts     ← Sửa
```

---

## 🔧 Notifications Service

```typescript
// notifications.service.ts
async getMyNotifications(userId: string) {
    const client = this.supabase.getClient();
    const { data } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return data;
}

async send(dto: SendNotificationDto) {
    const client = this.supabase.getClient();
    
    // Get appointment để lấy user_id
    const { data: appt } = await client
        .from('appointments')
        .select('guest_id, host_id')
        .eq('id', dto.appointmentId)
        .single();

    // Tạo notification cho cả guest và host
    const notifications = [
        { user_id: appt.guest_id, appointment_id: dto.appointmentId, type: dto.type, status: 'SENT' },
        { user_id: appt.host_id, appointment_id: dto.appointmentId, type: dto.type, status: 'SENT' },
    ];

    await client.from('notifications').insert(notifications);
    return { message: 'Notification sent' };
}
```

---

## 🔧 Reports Service

```typescript
// reports.service.ts
async getAppointmentStats() {
    const client = this.supabase.getClient();

    const { data: all } = await client.from('appointments').select('status');

    const stats = {
        total: all?.length || 0,
        pending: all?.filter(a => a.status === 'PENDING').length || 0,
        confirmed: all?.filter(a => a.status === 'CONFIRMED').length || 0,
        canceled: all?.filter(a => a.status === 'CANCELED').length || 0,
        completed: all?.filter(a => a.status === 'COMPLETED').length || 0,
    };

    return stats;
}
```

---

## 📝 DTO

```typescript
// dto/send-notification.dto.ts
export class SendNotificationDto {
    @IsUUID()
    appointmentId: string;

    @IsEnum(['APPOINTMENT_CREATED', 'CONFIRMED', 'CANCELED', 'REMINDER'])
    type: string;
}
```

---

## ✅ Checklist

- [ ] Tạo `notifications/dto/send-notification.dto.ts`
- [ ] Tạo `notifications/entities/notification.entity.ts`
- [ ] Implement `NotificationsService`
- [ ] Implement `ReportsService.getAppointmentStats()`
- [ ] Implement Controllers
- [ ] Test Swagger
