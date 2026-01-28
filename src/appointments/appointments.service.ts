import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseService } from '../supabase';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCanceledEvent,
} from '../events';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(guestId: string | null, dto: CreateAppointmentDto) {
    // Validate timeslot_id is provided
    if (!dto.timeSlotId) {
      throw new BadRequestException(
        'TimeSlot ID is required to book an appointment',
      );
    }

    // Use Admin Client to bypass RLS for booking logic (lock slot)
    const client = this.supabase.getAdminClient();

    // 1. ATOMIC: Lock timeslot (prevent race condition)
    const { data: timeslot, error: slotError } = await client
      .from('timeslots')
      .update({
        is_available: false,
      })
      .eq('id', dto.timeSlotId)
      .eq('is_available', true)
      .select('*, host:users!timeslots_host_id_fkey(id, name, email)')
      .single();

    if (slotError || !timeslot) {
      throw new ConflictException(
        'Slot đã được đặt bởi người khác. Vui lòng chọn slot khác.',
      );
    }

    // Prepare guest info
    let guestName = dto.guestName;
    let guestEmail = dto.guestEmail;
    let guestPhone = dto.guestPhone;

    if (guestId) {
      const { data: guest } = await client
        .from('users')
        .select('name, email, phone')
        .eq('id', guestId)
        .single();

      if (guest) {
        guestName = guest.name;
        guestEmail = guest.email;
        guestPhone = guest.phone;
      }
    }

    // 2. Create appointment
    const { data: appointment, error: apptError } = await client
      .from('appointments')
      .insert({
        guest_id: guestId, // Nullable
        host_id: dto.hostId,
        timeslot_id: dto.timeSlotId,
        reason: dto.reason,
        status: 'PENDING',
        // New fields for anonymous
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
      })
      .select('*, timeslots(*)')
      .single();

    if (apptError) {
      await client
        .from('timeslots')
        .update({ is_available: true })
        .eq('id', dto.timeSlotId);
      throw new BadRequestException(apptError.message);
    }

    // 3. Emit event (non-blocking email)
    this.eventEmitter.emit('appointment.created', {
      appointmentId: appointment.id,
      hostId: dto.hostId,
      hostName: timeslot.host?.name || 'Host',
      hostEmail: timeslot.host?.email,
      guestId: guestId || 'anonymous',
      guestName: guestName || 'Guest',
      guestEmail: guestEmail,
      date: timeslot.date,
      time: new Date(timeslot.start_time).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      reason: dto.reason,
    } as AppointmentCreatedEvent);

    return {
      id: appointment.id,
      status: appointment.status,
      hostId: appointment.host_id,
      guestId: appointment.guest_id,
      timeSlot: {
        startTime: appointment.timeslots?.start_time,
        endTime: appointment.timeslots?.end_time,
      },
      reason: appointment.reason,
      createdAt: appointment.created_at,
    };
  }

  async findMyAppointments(userId: string, role: string) {
    const client = this.supabase.getAdminClient(); // Use admin client to bypass RLS on timeslots

    let query = client
      .from('appointments')
      .select(
        `
                *,
                timeslots (id, start_time, end_time, is_available),
                host:users!appointments_host_id_fkey (id, name, email, specialty),
                guest:users!appointments_guest_id_fkey (id, name, email)
            `,
      )
      .order('created_at', { ascending: false });

    // Return appointments where user is either Host OR Guest
    query = query.or(`host_id.eq.${userId},guest_id.eq.${userId}`);

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.map((appt) => ({
      id: appt.id,
      status: appt.status,
      reason: appt.reason,
      timeSlotId: appt.timeslot_id,
      timeSlot: appt.timeslot_id
        ? {
            id: appt.timeslots?.id,
            startTime: appt.timeslots?.start_time,
            endTime: appt.timeslots?.end_time,
            isAvailable: appt.timeslots?.is_available,
          }
        : null,
      host: appt.host,
      guest: appt.guest || {
        name: appt.guest_name,
        email: appt.guest_email,
        phone: appt.guest_phone,
      },
      createdAt: appt.created_at,
      updatedAt: appt.updated_at,
    }));
  }

  async confirm(appointmentId: string, hostId: string) {
    // Use Admin Client to ensure reliability (ownership checked by query)
    const client = this.supabase.getAdminClient();

    console.log(`DEBUG: Confirming appt ${appointmentId} for host ${hostId}`);

    // Get appointment with relations
    const { data, error } = await client
      .from('appointments')
      .update({
        status: 'CONFIRMED',
      })
      .eq('id', appointmentId)
      .eq('host_id', hostId)
      .eq('status', 'PENDING')
      .select(
        `
                *,
                timeslots (*),
                host:users!appointments_host_id_fkey (id, name, email),
                guest:users!appointments_guest_id_fkey (id, name, email)
            `,
      )
      .single();

    if (error || !data) {
      console.error('Confirm Error:', error);
      throw new BadRequestException(
        'Cannot confirm this appointment. It may not exist, not belong to you, or not in PENDING status.',
      );
    }

    // Emit event for email
    this.eventEmitter.emit('appointment.confirmed', {
      appointmentId: data.id,
      hostName: data.host?.name || 'Host',
      guestName: data.guest?.name || data.guest_name || 'Guest',
      guestEmail: data.guest?.email || data.guest_email,
      date: data.timeslots?.date,
      time: new Date(data.timeslots?.start_time).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    } as AppointmentConfirmedEvent);

    return {
      id: data.id,
      status: data.status,
      message: 'Appointment confirmed successfully',
    };
  }

  async cancel(appointmentId: string, userId: string, cancelReason?: string) {
    const client = this.supabase.getClient();
    const adminClient = this.supabase.getAdminClient();

    // 1. Get appointment with relations
    const { data: appointment, error: fetchError } = await client
      .from('appointments')
      .select(
        `
                *,
                timeslots (*),
                host:users!appointments_host_id_fkey (id, name, email),
                guest:users!appointments_guest_id_fkey (id, name, email)
            `,
      )
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.guest_id !== userId && appointment.host_id !== userId) {
      throw new ForbiddenException('You can only cancel your own appointments');
    }

    if (appointment.status === 'CANCELED') {
      throw new BadRequestException('Appointment is already canceled');
    }
    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    // 2. Update status
    const { data: updatedAppointment, error: updateError } = await client
      .from('appointments')
      .update({
        status: 'CANCELED',
        cancel_reason: cancelReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    // 3. Unlock timeslot (use admin client to bypass RLS)
    await adminClient
      .from('timeslots')
      .update({ is_available: true })
      .eq('id', appointment.timeslot_id);

    // 4. Emit event for email
    const canceledBy = userId === appointment.host_id ? 'host' : 'guest';
    this.eventEmitter.emit('appointment.canceled', {
      appointmentId: updatedAppointment.id,
      hostId: appointment.host_id,
      hostName: appointment.host?.name || 'Host',
      hostEmail: appointment.host?.email,
      guestId: appointment.guest_id,
      guestName: appointment.guest?.name || appointment.guest_name || 'Guest',
      guestEmail: appointment.guest?.email || appointment.guest_email,
      date: appointment.timeslots?.date,
      time: new Date(appointment.timeslots?.start_time).toLocaleTimeString(
        'vi-VN',
        { hour: '2-digit', minute: '2-digit' },
      ),
      cancelReason,
      canceledBy,
    } as AppointmentCanceledEvent);

    return {
      id: updatedAppointment.id,
      status: updatedAppointment.status,
      cancelReason: updatedAppointment.cancel_reason,
      message: 'Appointment canceled successfully',
    };
  }
}
