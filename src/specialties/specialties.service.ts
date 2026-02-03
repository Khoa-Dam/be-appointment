import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class SpecialtiesService {
    constructor(private readonly supabase: SupabaseService) { }

    async findAll() {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('specialties')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string) {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('specialties')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException('Specialty not found');
        }

        return data;
    }
}
