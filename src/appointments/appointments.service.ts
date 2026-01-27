import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase';

@Injectable()
export class AppointmentsService {
  findMy(id: any) {
    throw new Error('Method not implemented.');
  }
  constructor(private readonly supabase: SupabaseService) {}

  async create(
    guestId: string,
    hostId: string,
    timeslotId: string,
    timeSlotId: string,
    reason?: string,
  ) {
    // Create appointment and lock timeslot
  }

  async findMyAppointments(userId: string) {
    // Get appointments where user is host or guest
  }

  async confirm(appointmentId: string, hostId: string) {
    // Update status to CONFIRMED
  }

  async cancel(appointmentId: string, userId: string, cancelReason?: string) {
    // Update status to CANCELED, unlock timeslot
  }
}
