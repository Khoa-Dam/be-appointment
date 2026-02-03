import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { GenerateTimeslotsDto } from './dto/generate-timeslots.dto';
import {
  add,
  eachDayOfInterval,
  format,
  isBefore,
  isSameDay,
  parseISO,
  set,
} from 'date-fns';
import { DayOfWeek } from '../common/enums';
import { TimeSlot } from './entities/timeslot.entity';
import { User } from '../users/entities/user.entity';
import { QueryTimeslotsDto } from './dto/query-timeslots.dto';
import { AvailabilityRule } from '../availability-rules/entities/availability-rule.entity';

@Injectable()
export class TimeslotsService {
  private readonly TIMESLOTS_TABLE = 'timeslots';
  private readonly RULES_TABLE = 'availability_rules';

  constructor(private readonly supabase: SupabaseService) { }

  // Tạo timeslot dự trên availabilityRule từ host
  async generateTimeslots(
    dto: GenerateTimeslotsDto,
    currentUser: any,
  ): Promise<{ created: number; message: string }> {
    const rule = await this._getAndValidateRule(dto.ruleId, currentUser.sub);

    const newTimeSlots = this._calculateSlots(rule, dto);

    if (newTimeSlots.length === 0) {
      return { created: 0, message: 'No new timeslots generated.' };
    }

    const { error, count } = await this.supabase
      .getClient()
      .from(this.TIMESLOTS_TABLE)
      .insert(newTimeSlots, { count: 'exact' });

    if (error) {
      console.error('Supabase insert error:', error);
      throw new InternalServerErrorException(
        `Failed to create timeslots: ${error.message}`,
      );
    }

    return { created: count ?? 0, message: 'TimeSlots generated successfully' };
  }

  //   /**
  //    * Finds available time slots for a given host, intended for a simple view.
  //    */
  // Tìm timeslot trống của host.
  async findAvailableSlots(
    queryParams: QueryTimeslotsDto,
  ): Promise<TimeSlot[]> {
    const { hostId } = queryParams;
    if (!hostId) {
      return [];
    }

    const query = this._createAvailableSlotsQuery(hostId).select(
      'id, start_time, end_time, is_available',
    );

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch timeslots: ${error.message}`,
      );
    }

    return data.map(
      (slot) =>
        new TimeSlot({
          id: slot.id,
          startTime: new Date(slot.start_time),
          endTime: new Date(slot.end_time),
          isAvailable: slot.is_available,
        }),
    );
  }

  /**
   * Finds available time slots for a given host, formatted for a detailed guest view.
   */
  async findGuestTimeslotsByHost(hostId: string): Promise<TimeSlot[]> {
    const query = this._createAvailableSlotsQuery(hostId).select(
      'id, host_id, start_time, end_time, is_available',
    );

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch timeslots for host: ${error.message}`,
      );
    }

    // Map data to TimeSlot entity and add presentation-specific fields
    return data.map((slot) => {
      const startTime = new Date(slot.start_time);
      const endTime = new Date(slot.end_time);

      return new TimeSlot({
        id: slot.id,
        hostId: slot.host_id,
        startTime,
        endTime,
        isAvailable: slot.is_available,
        date: format(startTime, 'yyyy-MM-dd'),
        startLabel: format(startTime, 'HH:mm'),
        endLabel: format(endTime, 'HH:mm'),
      });
    });
  }

  // --- Private Helper Methods ---

  /**
   * Fetches a rule and validates that the user is authorized to use it.
   */
  private async _getAndValidateRule(
    ruleId: string,
    hostId: string,
  ): Promise<AvailabilityRule> {
    const { data: rule, error: ruleError } = await this.supabase
      .getClient()
      .from(this.RULES_TABLE)
      .select('*')
      .eq('id', ruleId)
      .single();

    if (ruleError || !rule) {
      throw new NotFoundException('Availability rule not found.');
    }

    if (rule.host_id !== hostId) {
      throw new UnauthorizedException(
        'You can only generate slots for your own rules.',
      );
    }

    // Map snake_case to camelCase
    return new AvailabilityRule({
      id: rule.id,
      hostId: rule.host_id,
      ruleType: rule.rule_type,
      daysOfWeek: rule.days_of_week,
      startHour: rule.start_hour,
      endHour: rule.end_hour,
      isActive: rule.is_active,
      createdAt: new Date(rule.created_at),
      updatedAt: new Date(rule.updated_at),
    });
  }

  /**
   * Calculates all valid time slots within the given date range and rule.
   */
  private _calculateSlots(
    rule: AvailabilityRule,
    dto: GenerateTimeslotsDto,
  ): Partial<TimeSlot>[] {
    const { fromDate, toDate, slotDuration } = dto;
    const startDate = parseISO(fromDate);
    const endDate = parseISO(toDate);

    // Create a quick lookup map for valid days
    const dayMap = (rule.daysOfWeek as string).split(',').reduce((acc, day) => {
      acc[day.trim().toUpperCase()] = true;
      return acc;
    }, {});

    const allDatesInRange = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    const newTimeSlots: Partial<TimeSlot>[] = [];

    for (const day of allDatesInRange) {
      const dayOfWeek = format(day, 'E').toUpperCase() as DayOfWeek; // E.g., 'MON'

      if (dayMap[dayOfWeek]) {
        const slotsForDay = this._generateSlotsForDay(day, rule, slotDuration);
        newTimeSlots.push(...slotsForDay);
      }
    }
    return newTimeSlots;
  }

  /**
   * Generates the time slots for a single day based on the rule.
   */
  private _generateSlotsForDay(
    day: Date,
    rule: AvailabilityRule,
    slotDuration: number,
  ): Partial<TimeSlot>[] {
    const slots: Partial<TimeSlot>[] = [];
    let currentTime = set(day, {
      hours: rule.startHour,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });
    const endTimeOfDay = set(day, {
      hours: rule.endHour,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });

    while (isBefore(currentTime, endTimeOfDay)) {
      const slotEndTime = add(currentTime, { minutes: slotDuration });

      // Stop if the next slot would end after the allowed time
      if (isBefore(endTimeOfDay, slotEndTime)) {
        break;
      }

      slots.push({
        host_id: rule.hostId,
        rule_id: rule.id,
        date: format(day, 'yyyy-MM-dd'),
        start_time: currentTime,
        end_time: slotEndTime,
        is_available: true,
      } as any);
      currentTime = slotEndTime;
    }
    return slots;
  }

  /**
   * Creates a reusable Supabase query builder instance for fetching available slots.
   */
  private _createAvailableSlotsQuery(hostId: string) {
    return this.supabase
      .getClient()
      .from(this.TIMESLOTS_TABLE)
      .select()
      .eq('host_id', hostId)
      .eq('is_available', true)
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
  }
}
