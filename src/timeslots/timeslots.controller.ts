import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TimeslotsService } from './timeslots.service';
import { GenerateTimeslotsDto } from './dto/generate-timeslots.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums';
import { RolesGuard } from '../common/guards';
import { SupabaseGuard } from '../supabase';
import { QueryTimeslotsDto } from './dto/query-timeslots.dto';
import { TimeSlot } from './entities/timeslot.entity';

@Controller('timeslots')
export class TimeslotsController {
  constructor(private readonly timeslotsService: TimeslotsService) {}

  @Post('generate')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles(UserRole.HOST)
  async generateTimeSlots(
    @Body() generateDto: GenerateTimeslotsDto,
    @CurrentUser() currentUser: User,
  ): Promise<{ created: number; message: string }> {
    return this.timeslotsService.generateTimeslots(generateDto, currentUser);
  }

  //   @Get()
  //   async findAvailableSlots(
  //     @Query() queryParams: QueryTimeslotsDto,
  //   ): Promise<TimeSlot[]> {
  //     return this.timeslotsService.findAvailableSlots(queryParams);
  //   }

  @Get('host/:id')
  async findGuestTimeslotsByHost(
    @Param('id', ParseUUIDPipe) hostId: string,
  ): Promise<TimeSlot[]> {
    return this.timeslotsService.findGuestTimeslotsByHost(hostId);
  }
}
