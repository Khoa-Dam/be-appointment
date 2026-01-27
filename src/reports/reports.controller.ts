import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { SupabaseGuard } from '../supabase';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums';
import { AppointmentStatisticsDto } from './dto/appointment-statistics.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('appointments')
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get appointment statistics (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Appointment statistics',
        type: AppointmentStatisticsDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async getAppointmentStatistics() {
        return this.reportsService.getAppointmentStatistics();
    }
}
