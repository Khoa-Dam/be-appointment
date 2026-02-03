import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
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

    // Create appointment (Auth required)
    @Post()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new appointment (patient_id required)' })
    @ApiResponse({ status: 201, description: 'Appointment created' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(
        @CurrentUser() user: any,
        @Body() dto: CreateAppointmentDto,
    ) {
        return this.appointmentsService.create(user.sub, dto);
    }

    // Get my appointments
    @Get('my')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get my appointments' })
    @ApiResponse({ status: 200, description: 'List of appointments' })
    async getMyAppointments(@CurrentUser() user: any) {
        return this.appointmentsService.findMyAppointments(user.sub);
    }

    // Confirm appointment (Host only)
    @Patch(':id/confirm')
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.HOST)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Confirm appointment (Host only)' })
    @ApiParam({ name: 'id', description: 'Appointment ID' })
    @ApiResponse({ status: 200, description: 'Appointment confirmed' })
    async confirm(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        return this.appointmentsService.confirm(id, user.sub);
    }

    // Cancel appointment
    @Patch(':id/cancel')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Cancel appointment' })
    @ApiParam({ name: 'id', description: 'Appointment ID' })
    @ApiResponse({ status: 200, description: 'Appointment canceled' })
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: CancelAppointmentDto,
    ) {
        return this.appointmentsService.cancel(id, user.sub, dto.cancelReason);
    }

    // Mock payment
    @Post(':id/pay')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Mock payment for appointment' })
    @ApiParam({ name: 'id', description: 'Appointment ID' })
    @ApiResponse({ status: 200, description: 'Payment successful (mock)' })
    async mockPayment(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() paymentDto: { method: string; amount: number },
    ) {
        return this.appointmentsService.mockPayment(id, user.sub, paymentDto);
    }

    // Doctor Dashboard - Statistics
    @Get('doctor/dashboard')
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.HOST)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get doctor dashboard statistics (HOST only)',
    })
    @ApiQuery({ name: 'date', required: false, type: String, example: '2024-01-01' })
    @ApiResponse({
        status: 200,
        description: 'Dashboard statistics',
    })
    async getDoctorDashboard(
        @CurrentUser() user: any,
        @Query('date') date?: string,
    ) {
        return this.appointmentsService.getDoctorDashboard(user.sub, date);
    }

    // Doctor Dashboard - Today's appointments
    @Get('doctor/today')
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.HOST)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: "Get today's appointments sorted by time (HOST only)",
    })
    @ApiResponse({
        status: 200,
        description: 'Today appointments',
    })
    async getTodayAppointments(@CurrentUser() user: any) {
        return this.appointmentsService.getTodayAppointments(user.sub);
    }
}
