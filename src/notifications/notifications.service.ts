import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { NotificationType } from '../common/enums';

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

    async sendNotification(
        recipientId: string,
        type: NotificationType,
        appointmentId?: string,
    ) {
        const client = this.supabase.getAdminClient(); // Use admin client for system operations

        // Validate appointment exists if provided
        if (appointmentId) {
            const { data: appointment, error: appError } = await client
                .from('appointments')
                .select('id, host_id, guest_id')
                .eq('id', appointmentId)
                .single();

            if (appError || !appointment) {
                throw new NotFoundException(
                    `Appointment with ID ${appointmentId} not found`,
                );
            }

            // Validate recipient is either host or guest of the appointment
            if (
                recipientId !== appointment.host_id &&
                recipientId !== appointment.guest_id
            ) {
                throw new BadRequestException(
                    'Recipient must be host or guest of the appointment',
                );
            }
        }

        // Validate recipient exists
        const { data: user, error: userError } = await client
            .from('users')
            .select('id')
            .eq('id', recipientId)
            .single();

        if (userError || !user) {
            throw new NotFoundException(`User with ID ${recipientId} not found`);
        }

        // Create notification
        const { data, error } = await client
            .from('notifications')
            .insert({
                recipient_id: recipientId,
                type,
                appointment_id: appointmentId || null,
                status: 'SENT',
                sent_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            throw new BadRequestException(
                `Failed to send notification: ${error.message}`,
            );
        }

        return data;
    }

    async markAsRead(notificationId: string, userId: string) {
        // Update status to READ
    }
}
