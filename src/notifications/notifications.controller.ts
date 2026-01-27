import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, NotFoundException, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SupabaseGuard } from '../supabase';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendNotificationResponseDto } from './dto/send-notification-response.dto';
import { SupabaseService } from '../supabase';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly supabase: SupabaseService,
    ) { }

    @Get('my')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get my notifications' })
    @ApiResponse({
        status: 200,
        description: 'List of user notifications',
        type: [NotificationResponseDto],
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getMyNotifications(@CurrentUser() user: any) {
        return this.notificationsService.findMyNotifications(user.sub);
    }

    @Post('send')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Send notification (Admin/System only)' })
    @ApiBody({ type: SendNotificationDto })
    @ApiResponse({
        status: 201,
        description: 'Notification sent successfully',
        type: SendNotificationResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async sendNotification(@Body() dto: SendNotificationDto) {
        // Determine recipients from appointment
        // Use admin client to bypass RLS for system operations
        const client = this.supabase.getAdminClient();
        const { data: appointment, error } = await client
            .from('appointments')
            .select('host_id, guest_id')
            .eq('id', dto.appointmentId)
            .single();

        if (error || !appointment) {
            throw new NotFoundException('Appointment not found');
        }

        // Send to both host and guest
        // Send to both host and guest (filter out nulls for anonymous guests)
        const recipients = [appointment.host_id, appointment.guest_id].filter(id => id !== null);

        for (const recipientId of recipients) {
            await this.notificationsService.sendNotification(
                recipientId,
                dto.type,
                dto.appointmentId,
            );
        }

        return { message: 'Notification sent' };
    }
    @Sse('sse')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Real-time notifications (SSE)' })
    @ApiResponse({ status: 200, description: 'Stream of notifications' })
    sse(@CurrentUser() user: any): Observable<any> {
        return this.notificationsService.getNotificationsStream(user.sub);
    }
}
