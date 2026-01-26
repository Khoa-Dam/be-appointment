import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class NotificationsService {
    constructor(private readonly supabase: SupabaseService) { }

    async findMyNotifications(userId: string) {
        // Get notifications for user
    }

    async sendNotification(recipientId: string, type: string, appointmentId?: string) {
        // Create notification
    }

    async markAsRead(notificationId: string, userId: string) {
        // Update status to READ
    }
}
