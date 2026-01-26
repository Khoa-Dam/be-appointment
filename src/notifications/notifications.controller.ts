import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SupabaseGuard } from '../supabase';
import { CurrentUser } from '../common/decorators';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

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

    // POST /notifications/send
}
