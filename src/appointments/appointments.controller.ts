import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { SupabaseGuard } from '../supabase';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums';
import { CreateAppointmentDto, CancelAppointmentDto } from './dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new appointment (Book a timeslot)' })
    @ApiResponse({ status: 201, description: 'Appointment created successfully' })
    @ApiResponse({ status: 409, description: 'Slot already booked by someone else' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(
        @CurrentUser() user: any,
        @Body() dto: CreateAppointmentDto,
    ) {
        return this.appointmentsService.create(user.sub, dto);
    }

    @Get('my')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get my appointments (as Guest or Host)' })
    @ApiResponse({ status: 200, description: 'List of appointments' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getMyAppointments(@CurrentUser() user: any) {
        const role = user.role || user.user_metadata?.role || 'GUEST';
        return this.appointmentsService.findMyAppointments(user.sub, role);
    }

    @Patch(':id/confirm')
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.HOST)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Confirm an appointment (Host only)' })
    @ApiParam({ name: 'id', description: 'Appointment ID' })
    @ApiResponse({ status: 200, description: 'Appointment confirmed' })
    @ApiResponse({ status: 400, description: 'Cannot confirm this appointment' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Host only' })
    async confirm(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.appointmentsService.confirm(id, user.sub);
    }

    @Patch(':id/cancel')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cancel an appointment (Guest or Host)' })
    @ApiParam({ name: 'id', description: 'Appointment ID' })
    @ApiResponse({ status: 200, description: 'Appointment canceled' })
    @ApiResponse({ status: 400, description: 'Cannot cancel this appointment' })
    @ApiResponse({ status: 403, description: 'Not your appointment' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: CancelAppointmentDto,
    ) {
        return this.appointmentsService.cancel(id, user.sub, dto.cancelReason);
    }
}
