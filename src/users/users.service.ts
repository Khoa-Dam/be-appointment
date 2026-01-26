import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class UsersService {
    constructor(private readonly supabase: SupabaseService) { }

    async findAll() {
        // Get all users (Admin)
    }

    async disableUser(userId: string) {
        // Set isActive = false
    }

    async findHosts(specialty?: string) {
        // Get hosts with optional filter
    }

    async findHostById(hostId: string) {
        // Get host detail with availability rules
    }
}
