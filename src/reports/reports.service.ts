import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class ReportsService {
    constructor(private readonly supabase: SupabaseService) { }

    async getAppointmentStatistics() {
        // Use admin client to bypass RLS for admin statistics
        const client = this.supabase.getAdminClient();

        // Get total count
        const { count: total, error: totalError } = await client
            .from('appointments')
            .select('*', { count: 'exact', head: true });

        if (totalError) {
            throw new BadRequestException(
                `Failed to fetch statistics: ${totalError.message}`,
            );
        }

        // Get confirmed count
        const { count: confirmed, error: confirmedError } = await client
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'CONFIRMED');

        if (confirmedError) {
            throw new BadRequestException(
                `Failed to fetch confirmed count: ${confirmedError.message}`,
            );
        }

        // Get canceled count
        const { count: canceled, error: canceledError } = await client
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'CANCELED');

        if (canceledError) {
            throw new BadRequestException(
                `Failed to fetch canceled count: ${canceledError.message}`,
            );
        }

        return {
            total: total || 0,
            confirmed: confirmed || 0,
            canceled: canceled || 0,
        };
    }
}
