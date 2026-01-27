# 👤 Person 2: TimeSlots Module

## 📋 Nhiệm Vụ

| # | Route | Method | Auth |
|---|-------|--------|------|
| 7 | `/timeslots/generate` | POST | Host |
| 8 | `/timeslots?hostId=xxx` | GET | Public |
| 18 | `/hosts/:id/timeslots` | GET | Public |

---

## 📁 Files Cần Tạo/Sửa

```
src/timeslots/
├── timeslots.controller.ts  ← Sửa
├── timeslots.service.ts     ← Sửa
├── dto/generate-slots.dto.ts ← Tạo mới
└── entities/timeslot.entity.ts ← Tạo mới
```

---

## 🔧 Core Logic: Generate Slots

```typescript
// Sinh slots từ rule
async generate(hostId: string, dto: GenerateSlotsDto) {
    // 1. Lấy rule
    const rule = await this.getRule(dto.ruleId);
    
    // 2. Loop qua từng ngày trong range
    for (let d = fromDate; d <= toDate; d++) {
        // Check ngày có trong daysOfWeek không
        if (!rule.daysOfWeek.includes(dayName)) continue;
        
        // 3. Sinh slots theo duration
        for (let h = rule.startHour; h < rule.endHour; h += duration/60) {
            slots.push({ startTime, endTime, hostId, isAvailable: true });
        }
    }
    
    // 4. Insert tất cả
    await client.from('timeslots').insert(slots);
}
```

---

## ⚡ Race Condition Prevention

```typescript
// Khi book slot - atomic update
const { data } = await client
    .from('timeslots')
    .update({ is_available: false })
    .eq('id', slotId)
    .eq('is_available', true)  // ← CHỈ UPDATE NẾU CÒN AVAILABLE
    .select().single();

if (!data) throw new ConflictException('Slot đã được đặt');
```

---

## ✅ Checklist

- [ ] Tạo `dto/generate-slots.dto.ts`
- [ ] Tạo `entities/timeslot.entity.ts`
- [ ] Implement `generate()` method
- [ ] Implement `findByHostId()` method
- [ ] Thêm route `/hosts/:id/timeslots`
- [ ] Test Swagger
