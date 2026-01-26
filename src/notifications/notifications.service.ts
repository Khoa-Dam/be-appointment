import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class NotificationsService {
    constructor(private readonly supabase: SupabaseService) { }

    async findMyNotifications(userId: string) {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('notifications')
            .select('id, type, status, sent_at, appointment_id')
            .eq('recipient_id', userId)
            .order('sent_at', { ascending: false });

        if (error) {
            throw new BadRequestException(`Failed to fetch notifications: ${error.message}`);
        }

        return data.map((notif) => ({
            id: notif.id,
            type: notif.type,
            sentAt: notif.sent_at,
            status: notif.status,
        }));
    }

    async sendNotification(recipientId: string, type: string, appointmentId?: string) {
        // Create notification
    }

    async markAsRead(notificationId: string, userId: string) {
        // Update status to READ
    }
}
