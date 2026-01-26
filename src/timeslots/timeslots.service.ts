import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class TimeslotsService {
    constructor(private readonly supabase: SupabaseService) { }

    async generateSlots(ruleId: string, slotDuration: number, fromDate: Date, toDate: Date) {
        // Generate timeslots from availability rule
    }

    async findAvailableSlots(hostId: string) {
        // Query available slots
    }
}
