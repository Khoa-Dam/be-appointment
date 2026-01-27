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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('timeslots')
@Controller('timeslots')
export class TimeslotsController {
  constructor(private readonly timeslotsService: TimeslotsService) { }

  @Post('generate')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles(UserRole.HOST)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Generate timeslots based on an Availability Rule',
    description:
      'Generates time slots for a specified date range and rule. Only Hosts can perform this action.',
  })
  @ApiResponse({
    status: 201,
    description: 'Timeslots generated successfully.',
    schema: {
      example: {
        created: 10,
        message: 'TimeSlots generated successfully',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden. Only Hosts allowed.' })
  @ApiResponse({ status: 404, description: 'Availability Rule not found.' })
  @ApiBody({ type: GenerateTimeslotsDto })
  async generateTimeSlots(
    @Body() generateDto: GenerateTimeslotsDto,
    @CurrentUser() currentUser: any,
  ): Promise<{ created: number; message: string }> {
    return this.timeslotsService.generateTimeslots(generateDto, currentUser);
  }

  @Get()
  @ApiOperation({
    summary: 'Find available timeslots',
    description: 'Get all available timeslots matching the query parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available timeslots.',
    type: [TimeSlot],
  })
  @ApiQuery({ name: 'hostId', required: false, description: 'Filter by Host ID' })
  async findAvailableSlots(
    @Query() queryParams: QueryTimeslotsDto,
  ): Promise<TimeSlot[]> {
    return this.timeslotsService.findAvailableSlots(queryParams);
  }

  @Get('host/:id')
  @ApiOperation({
    summary: 'Find timeslots for a specific host (Detailed View)',
    description:
      'Get all available timeslots for a specific host, including formatted labels for frontend use.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of timeslots for the host.',
    type: [TimeSlot],
  })
  @ApiParam({ name: 'id', description: 'The UUID of the Host' })
  async findGuestTimeslotsByHost(
    @Param('id', ParseUUIDPipe) hostId: string,
  ): Promise<TimeSlot[]> {
    return this.timeslotsService.findGuestTimeslotsByHost(hostId);
  }
}
