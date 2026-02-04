import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
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

  async create(guestId: string, dto: CreateAppointmentDto) {
    const client = this.supabase.getClient();

    // REQUIRED: guestId must be authenticated user
    if (!guestId) {
      throw new UnauthorizedException(
        'You must be logged in to create an appointment',
      );
    }

    console.log('Creating appointment for guest:', guestId, 'DTO:', dto);

    // Validate patient belongs to user
    const { data: patient, error: patientError } = await client
      .from('patients')
      .select('*')
      .eq('id', dto.patientId)
      .eq('owner_id', guestId)
      .single();

    if (patientError || !patient) {
      console.error('Patient validation failed:', patientError, 'Patient:', patient);
      throw new BadRequestException(
        'Patient not found or does not belong to you',
      );
    }

    // Validate timeslot exists and is available
    const { data: timeslot, error: timeslotError } = await client
      .from('timeslots')
      .select('*')
      .eq('id', dto.timeslotId)
      .eq('host_id', dto.hostId)
      .eq('is_available', true)
      .single();

    if (timeslotError || !timeslot) {
      console.error('Timeslot validation failed:', timeslotError, 'Timeslot:', timeslot);
      throw new BadRequestException('Timeslot not available');
    }

    // Validate guest != host (không tự đặt lịch cho mình)
    if (guestId === dto.hostId) {
      throw new BadRequestException(
        'You cannot book an appointment with yourself',
      );
    }

    // Create appointment (trigger sẽ tự động populate patient_name, doctor_name, phone)
    const { data, error } = await client
      .from('appointments')
      .insert({
        host_id: dto.hostId,
        guest_id: guestId,
        timeslot_id: dto.timeslotId,
        patient_id: dto.patientId,
        status: 'PENDING',
        payment_status: 'PENDING',
        payment_method: dto.paymentMethod,
        payment_amount: dto.paymentAmount,
      })
      .select(`
        *,
        guest:users!guest_id(email, name),
        host:users!host_id(email, name),
        timeslot:timeslots!timeslot_id(date, start_time)
      `)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Mark timeslot as unavailable
    await client
      .from('timeslots')
      .update({ is_available: false })
      .eq('id', dto.timeslotId);

    // Emit event for email notification
    try {
      const timeslot = data.timeslot as any; // Type casting due to join
      const host = data.host as any;
      const guest = data.guest as any;

      if (host && guest && timeslot) {
        this.eventEmitter.emit('appointment.created', new AppointmentCreatedEvent({
          appointmentId: data.id,
          hostId: dto.hostId,
          hostEmail: host.email,
          hostName: host.name,
          guestId: guestId,
          guestEmail: guest.email,
          guestName: guest.name,
          date: timeslot.date,
          time: new Date(timeslot.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }));
      }
    } catch (e) {
      console.error('Failed to emit appointment.created event', e);
    }

    return data;
  }

  async findMyAppointments(userId: string) {
    const client = this.supabase.getClient();

    console.log('Finding appointments for user:', userId);

    const { data, error } = await client
      .from('appointments')
      .select(
        `
        id,
        doctor:host_id (name,title, address, specialty ),
        patient_name,
        phone,
        status,
        payment_status,
        payment_amount,
        cancel_reason,
        created_at,
        timeslots:timeslot_id (start_time, end_time),
        hosts:users!host_id (
          id,
          name,
          email,
          phone,
          specialty,
          description,
          address,
          title
        )
      `,
      )
      .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    console.log('Data count:', data?.length);
    if (error) {
      console.error('Error fetching appointments:', error);
      throw new BadRequestException(error.message);
    }

    // Map hosts to doctor for frontend compatibility
    const mappedData = data?.map((appointment) => {
      const host = Array.isArray(appointment.hosts)
        ? appointment.hosts[0]
        : appointment.hosts;

      return {
        ...appointment,
        doctor: host
          ? {
            id: host.id,
            name: host.name,
            email: host.email,
            phone: host.phone,
            specialty: host.specialty,
            description: host.description,
            address: host.address,
            title: host.title,
          }
          : undefined,
      };
    });

    return mappedData;
  }

  async confirm(appointmentId: string, hostId: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('appointments')
      .update({ status: 'CONFIRMED' })
      .eq('id', appointmentId)
      .eq('host_id', hostId)
      .eq('status', 'PENDING')
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(
        'Cannot confirm this appointment. It may not exist, not belong to you, or not in PENDING status.',
      );
    }

    // Emit event for email notification (optional)
    // this.eventEmitter.emit('appointment.confirmed', {...});

    return data;
  }

  async cancel(appointmentId: string, userId: string, cancelReason?: string) {
    const client = this.supabase.getClient();

    // Verify ownership
    const { data: appointment, error: fetchError } = await client
      .from('appointments')
      .select('*, timeslots:timeslot_id(id, start_time)')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.guest_id !== userId && appointment.host_id !== userId) {
      throw new ForbiddenException('You cannot cancel this appointment');
    }

    if (appointment.status === 'CANCELED') {
      throw new BadRequestException('Appointment already canceled');
    }

    // Update status
    const { data: updatedData, error } = await client
      .from('appointments')
      .update({
        status: 'CANCELED',
        cancel_reason: cancelReason,
      })
      .eq('id', appointmentId)
      .select(`
        *,
        guest:users!guest_id(email, name),
        host:users!host_id(email, name),
        timeslot:timeslots!timeslot_id(date, start_time)
      `)
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Release timeslot
    if (appointment.timeslot_id) { // Use timeslot_id from initial fetch (included in *)
      await client
        .from('timeslots')
        .update({ is_available: true })
        .eq('id', appointment.timeslot_id);
    }

    // Emit event
    try {
      const timeslot = updatedData.timeslot as any;
      const host = updatedData.host as any;
      const guest = updatedData.guest as any;
      const canceledBy = userId === appointment.host_id ? 'host' : 'guest';

      if (host && guest && timeslot) {
        this.eventEmitter.emit('appointment.canceled', new AppointmentCanceledEvent({
          appointmentId: updatedData.id,
          hostId: updatedData.host_id,
          hostName: host.name,
          hostEmail: host.email,
          guestId: updatedData.guest_id,
          guestName: guest.name,
          guestEmail: guest.email,
          date: timeslot.date,
          time: new Date(timeslot.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          cancelReason: cancelReason,
          canceledBy: canceledBy
        }));
      }
    } catch (e) {
      console.error('Failed to emit appointment.canceled event', e);
    }

    return updatedData;
  }

  async mockPayment(
    appointmentId: string,
    userId: string,
    paymentDto: { method: string; amount: number },
  ) {
    const client = this.supabase.getClient();

    // Verify appointment belongs to user
    const { data: appointment, error: appError } = await client
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('guest_id', userId)
      .single();

    if (appError || !appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.payment_status === 'PAID') {
      throw new BadRequestException('Appointment already paid');
    }

    // Mock payment success
    const { data, error } = await client
      .from('appointments')
      .update({
        payment_status: 'PAID',
        payment_method: paymentDto.method,
        payment_amount: paymentDto.amount,
        paid_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Payment failed');
    }

    return {
      success: true,
      message: 'Payment successful (mock)',
      data,
    };
  }

  // Doctor Dashboard
  async getDoctorDashboard(hostId: string, date?: string) {
    const client = this.supabase.getClient();
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get all appointments for the date
    const { data: appointments } = await client
      .from('appointments')
      .select(
        `
        *,
        timeslots:timeslot_id (start_time, end_time)
      `,
      )
      .eq('host_id', hostId)
      .gte('timeslots.start_time', `${targetDate}T00:00:00`)
      .lte('timeslots.start_time', `${targetDate}T23:59:59`);

    const total = appointments?.length || 0;
    const confirmed =
      appointments?.filter((a) => a.status === 'CONFIRMED').length || 0;
    const pending =
      appointments?.filter((a) => a.status === 'PENDING').length || 0;
    const canceled =
      appointments?.filter((a) => a.status === 'CANCELED').length || 0;

    return {
      date: targetDate,
      statistics: {
        total,
        confirmed,
        pending,
        canceled,
      },
    };
  }

  async getTodayAppointments(hostId: string) {
    const client = this.supabase.getClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await client
      .from('appointments')
      .select(
        `
        id,
        patient_name,
        phone,
        status,
        payment_status,
        created_at,
        timeslots:timeslot_id (start_time, end_time)
      `,
      )
      .eq('host_id', hostId)
      .gte('timeslots.start_time', `${today}T00:00:00`)
      .lte('timeslots.start_time', `${today}T23:59:59`)
      .order('timeslots(start_time)', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  // Get appointments by date range (for calendar view)
  async getAppointmentsByRange(hostId: string, startDate: string, endDate: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('appointments')
      .select(
        `
        id,
        patient_name,
        phone,
        status,
        payment_status,
        created_at,
        timeslots:timeslot_id (id, start_time, end_time)
      `,
      )
      .eq('host_id', hostId)
      .gte('timeslots.start_time', `${startDate}T00:00:00`)
      .lte('timeslots.start_time', `${endDate}T23:59:59`)
      .order('timeslots(start_time)', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
