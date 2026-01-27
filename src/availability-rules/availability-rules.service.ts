import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { RuleType } from '../common/enums';
import { UserRole } from '../common/enums';

@Injectable()
export class AvailabilityRulesService {
    constructor(private readonly supabase: SupabaseService) { }

    async create(hostId: string, dto: CreateAvailabilityRuleDto) {
        const client = this.supabase.getClient();

        // 1. Check current user role
        const { data: user, error: userError } = await client
            .from('users')
            .select('role')
            .eq('id', hostId)
            .single();

        if (userError || !user) {
            throw new BadRequestException('User not found.');
        }

        // 2. Auto-Upgrade to HOST if not already
        if (user.role !== UserRole.HOST) {
            const updateData: any = { role: UserRole.HOST };

            // Add profile fields if provided
            if (dto.specialty) updateData.specialty = dto.specialty;
            if (dto.description) updateData.description = dto.description;
            if (dto.address) updateData.address = dto.address;

            const { error: updateError } = await client
                .from('users')
                .update(updateData)
                .eq('id', hostId);

            if (updateError) {
                throw new BadRequestException(`Failed to upgrade to HOST: ${updateError.message}`);
            }
        }

        // 3. Create Availability Rule (Normal flow)
        // Default to WEEKLY if not provided
        const ruleType = dto.ruleType || RuleType.WEEKLY;

        const { data, error } = await client
            .from('availability_rules')
            .insert({
                host_id: hostId,
                rule_type: ruleType,
                days_of_week: dto.daysOfWeek,
                start_hour: dto.startHour,
                end_hour: dto.endHour,
                is_active: dto.isActive ?? true,
            })
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return {
            ...data,
            message: user.role !== UserRole.HOST ? 'User upgraded to HOST and rule created.' : 'Rule created successfully.'
        };
    }

    async findByHostId(hostId: string) {
        const client = this.supabase.getClient();
        const { data, error } = await client
            .from('availability_rules')
            .select('*')
            .eq('host_id', hostId)
            // .eq('is_active', true) // Optionally filter active rules
            .order('created_at', { ascending: false });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async update(ruleId: string, hostId: string, dto: UpdateAvailabilityRuleDto) {
        const client = this.supabase.getClient();

        // 1. Verify rule exists and belongs to host
        const { data: rule } = await client
            .from('availability_rules')
            .select('host_id')
            .eq('id', ruleId)
            .single();

        if (!rule) {
            throw new BadRequestException('Rule not found');
        }

        if (rule.host_id !== hostId) {
            throw new BadRequestException('You can only update your own rules');
        }

        // 2. Update rule
        const { data, error } = await client
            .from('availability_rules')
            .update({
                rule_type: dto.ruleType,
                days_of_week: dto.daysOfWeek,
                start_hour: dto.startHour,
                end_hour: dto.endHour,
                is_active: dto.isActive,
                updated_at: new Date().toISOString(),
            })
            .eq('id', ruleId)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async delete(ruleId: string, hostId: string) {
        const client = this.supabase.getClient();

        // 1. Verify rule exists and belongs to host
        const { data: rule } = await client
            .from('availability_rules')
            .select('host_id')
            .eq('id', ruleId)
            .single();

        if (!rule) {
            throw new BadRequestException('Rule not found');
        }

        if (rule.host_id !== hostId) {
            throw new BadRequestException('You can only delete your own rules');
        }

        // 2. Delete rule
        const { error } = await client
            .from('availability_rules')
            .delete()
            .eq('id', ruleId);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Rule deleted successfully' };
    }
}
