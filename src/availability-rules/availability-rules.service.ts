import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
interface AvailabilityRuleRecord {
  id: string;
  host_id: string;
  rule_type: string;
  start_hour: number;
  end_hour: number;
  days_of_week: string | null;
  is_active: boolean;
}
@Injectable()
export class AvailabilityRulesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(hostId: string, ruleData: CreateAvailabilityRuleDto) {
    const { data, error } = (await this.supabase
      .getClient()
      .from('availability_rules')
      .insert({
        host_id: hostId,
        rule_type: ruleData.ruleType,
        start_hour: ruleData.startHour,
        end_hour: ruleData.endHour,
        days_of_week: ruleData.daysOfWeek,
        is_active: ruleData.isActive ?? true,
      })
      .select()
      .eq('host_id', hostId)) as {
      data: AvailabilityRuleRecord[] | null;
      error: { message: string } | null;
    };

    if (error) {
      // Log the error internally and throw a user-friendly one
      throw new BadRequestException(`Could not create rule: ${error.message}`);
    }

    return (data || []).map((rule) => this.mapToDto(rule));
  }

  async findByHostId(hostId: string) {
    const { data, error } = (await this.supabase
      .getClient()
      .from('availability_rules')
      .select('*')
      .eq('host_id', hostId)) as {
      data: AvailabilityRuleRecord[] | null;
      error: { message: string } | null;
    };

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map((rule) => this.mapToDto(rule));
  }

  // Private helper to keep your mapping logic in one place
  private mapToDto(rule: AvailabilityRuleRecord) {
    return {
      id: rule.id,
      hostId: rule.host_id,
      ruleType: rule.rule_type,
      startHour: rule.start_hour,
      endHour: rule.end_hour,
      daysOfWeek: rule.days_of_week,
      isActive: rule.is_active,
    };
  }
}
