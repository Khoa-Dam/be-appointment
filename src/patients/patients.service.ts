import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
    constructor(private readonly supabase: SupabaseService) { }

    async create(ownerId: string, dto: CreatePatientDto) {
        const client = this.supabase.getClient();

        // Check current patient count
        const { count, error: countError } = await client
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId);

        if (countError) {
            throw new BadRequestException(countError.message);
        }

        if ((count ?? 0) >= 5) {
            throw new BadRequestException('Maximum 5 patient profiles allowed per user');
        }

        // Create patient
        const { data, error } = await client
            .from('patients')
            .insert({
                owner_id: ownerId,
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                dob: dto.dob,
                gender: dto.gender,
            })
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findMyPatients(ownerId: string) {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('patients')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async findOne(id: string, ownerId: string) {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('patients')
            .select('*')
            .eq('id', id)
            .eq('owner_id', ownerId)
            .single();

        if (error || !data) {
            throw new NotFoundException('Patient not found');
        }

        return data;
    }

    async update(id: string, ownerId: string, dto: UpdatePatientDto) {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('patients')
            .update({
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                dob: dto.dob,
                gender: dto.gender,
            })
            .eq('id', id)
            .eq('owner_id', ownerId)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        if (!data) {
            throw new NotFoundException('Patient not found');
        }

        return data;
    }

    async delete(id: string, ownerId: string) {
        const client = this.supabase.getClient();

        const { error } = await client
            .from('patients')
            .delete()
            .eq('id', id)
            .eq('owner_id', ownerId);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Patient deleted successfully' };
    }
}
