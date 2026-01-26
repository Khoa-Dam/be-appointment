import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class AvailabilityRulesService {
    constructor(private readonly supabase: SupabaseService) { }

    async create(hostId: string, ruleData: any) {
        // Create availability rule
    }

    async findByHostId(hostId: string) {
        // Get rules of host
    }
}
