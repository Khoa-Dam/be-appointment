import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class ReportsService {
    constructor(private readonly supabase: SupabaseService) { }

    async getAppointmentStatistics() {
        // Query appointments aggregation
    }
}
