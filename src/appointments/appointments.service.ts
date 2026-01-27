import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseService } from '../supabase';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentCreatedEvent, AppointmentConfirmedEvent, AppointmentCanceledEvent } from '../events';

@Injectable()
export class AppointmentsService {
    constructor(
        private readonly supabase: SupabaseService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async create(guestId: string, dto: CreateAppointmentDto) {
        const client = this.supabase.getClient();

        // 1. ATOMIC: Lock timeslot (prevent race condition)
        const { data: timeslot, error: slotError } = await client
            .from('timeslots')
            .update({
                is_available: false,
                booked_by: guestId,
                updated_at: new Date().toISOString()
            })
            .eq('id', dto.timeSlotId)
            .eq('is_available', true)
            .select('*, host:users!timeslots_host_id_fkey(id, name, email)')
            .single();

        if (slotError || !timeslot) {
            throw new ConflictException('Slot đã được đặt bởi người khác. Vui lòng chọn slot khác.');
        }

        // Get guest info
        const { data: guest } = await client
            .from('users')
            .select('id, name, email')
            .eq('id', guestId)
            .single();

        // 2. Create appointment
        const { data: appointment, error: apptError } = await client
            .from('appointments')
            .insert({
                guest_id: guestId,
                host_id: dto.hostId,
                timeslot_id: dto.timeSlotId,
                reason: dto.reason,
                status: 'PENDING',
            })
            .select('*, timeslots(*)')
            .single();

        if (apptError) {
            await client
                .from('timeslots')
                .update({ is_available: true, booked_by: null })
                .eq('id', dto.timeSlotId);
            throw new BadRequestException(apptError.message);
        }

        // 3. Emit event (non-blocking email)
        this.eventEmitter.emit('appointment.created', {
            appointmentId: appointment.id,
            hostId: dto.hostId,
            hostName: timeslot.host?.name || 'Host',
            hostEmail: timeslot.host?.email,
            guestId,
            guestName: guest?.name || 'Guest',
            guestEmail: guest?.email,
            date: timeslot.date,
            time: new Date(timeslot.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
        const client = this.supabase.getClient();

        let query = client
            .from('appointments')
            .select(`
                *,
                timeslots (*),
                host:users!appointments_host_id_fkey (id, name, email, specialty),
                guest:users!appointments_guest_id_fkey (id, name, email)
            `)
            .order('created_at', { ascending: false });

        if (role === 'HOST') {
            query = query.eq('host_id', userId);
        } else {
            query = query.eq('guest_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data.map(appt => ({
            id: appt.id,
            status: appt.status,
            reason: appt.reason,
            cancelReason: appt.cancel_reason,
            timeSlot: {
                date: appt.timeslots?.date,
                startTime: appt.timeslots?.start_time,
                endTime: appt.timeslots?.end_time,
            },
            host: appt.host,
            guest: appt.guest,
            createdAt: appt.created_at,
            updatedAt: appt.updated_at,
        }));
    }

    async confirm(appointmentId: string, hostId: string) {
        const client = this.supabase.getClient();

        // Get appointment with relations
        const { data, error } = await client
            .from('appointments')
            .update({
                status: 'CONFIRMED',
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
            .eq('host_id', hostId)
            .eq('status', 'PENDING')
            .select(`
                *,
                timeslots (*),
                host:users!appointments_host_id_fkey (id, name, email),
                guest:users!appointments_guest_id_fkey (id, name, email)
            `)
            .single();

        if (error || !data) {
            throw new BadRequestException('Cannot confirm this appointment. It may not exist, not belong to you, or not in PENDING status.');
        }

        // Emit event for email
        this.eventEmitter.emit('appointment.confirmed', {
            appointmentId: data.id,
            hostName: data.host?.name || 'Host',
            guestName: data.guest?.name || 'Guest',
            guestEmail: data.guest?.email,
            date: data.timeslots?.date,
            time: new Date(data.timeslots?.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        } as AppointmentConfirmedEvent);

        return {
            id: data.id,
            status: data.status,
            message: 'Appointment confirmed successfully',
        };
    }

    async cancel(appointmentId: string, userId: string, cancelReason?: string) {
        const client = this.supabase.getClient();

        // 1. Get appointment with relations
        const { data: appointment, error: fetchError } = await client
            .from('appointments')
            .select(`
                *,
                timeslots (*),
                host:users!appointments_host_id_fkey (id, name, email),
                guest:users!appointments_guest_id_fkey (id, name, email)
            `)
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
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
            .select()
            .single();

        if (updateError) {
            throw new BadRequestException(updateError.message);
        }

        // 3. Unlock timeslot
        await client
            .from('timeslots')
            .update({ is_available: true, booked_by: null })
            .eq('id', appointment.timeslot_id);

        // 4. Emit event for email
        const canceledBy = userId === appointment.host_id ? 'host' : 'guest';
        this.eventEmitter.emit('appointment.canceled', {
            appointmentId: updatedAppointment.id,
            hostId: appointment.host_id,
            hostName: appointment.host?.name || 'Host',
            hostEmail: appointment.host?.email,
            guestId: appointment.guest_id,
            guestName: appointment.guest?.name || 'Guest',
            guestEmail: appointment.guest?.email,
            date: appointment.timeslots?.date,
            time: new Date(appointment.timeslots?.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
