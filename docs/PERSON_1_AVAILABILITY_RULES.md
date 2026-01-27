# 👤 Person 1: Availability Rules Module

## 📋 Nhiệm Vụ

| # | Route | Method | Auth |
|---|-------|--------|------|
| 5 | `/availability-rules` | POST | Host |
| 6 | `/availability-rules/:hostId` | GET | Public |

---

## 📁 Files Cần Tạo/Sửa

```
src/availability-rules/
├── availability-rules.controller.ts  ← Sửa
├── availability-rules.service.ts     ← Sửa
├── dto/create-rule.dto.ts           ← Tạo mới
└── entities/availability-rule.entity.ts ← Tạo mới
```

---

## 🔧 Service Code

```typescript
// availability-rules.service.ts
@Injectable()
export class AvailabilityRulesService {
    constructor(private readonly supabase: SupabaseService) {}

    async create(hostId: string, dto: CreateRuleDto) {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from('availability_rules')
            .insert({
                host_id: hostId,
                rule_type: dto.ruleType,
                days_of_week: dto.daysOfWeek,
                start_hour: dto.startHour,
                end_hour: dto.endHour,
                is_active: dto.isActive ?? true,
            })
            .select().single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async findByHostId(hostId: string) {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from('availability_rules')
            .select('*')
            .eq('host_id', hostId)
            .eq('is_active', true);
        if (error) throw new BadRequestException(error.message);
        return data;
    }
}
```

---

## ✅ Checklist

- [ ] Tạo `dto/create-rule.dto.ts`
- [ ] Tạo `entities/availability-rule.entity.ts`
- [ ] Implement Service
- [ ] Implement Controller
- [ ] Test Swagger
