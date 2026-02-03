import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { SupabaseService } from '../supabase';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let supabaseService: Partial<SupabaseService>;
  let eventEmitter: Partial<EventEmitter2>;

  const mockClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(async () => {
    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockClient),
      getAdminClient: jest.fn().mockReturnValue(mockClient),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw UnauthorizedException if guestId is null', async () => {
      await expect(
        service.create(null as any, {
          hostId: 'host-id',
          timeslotId: 'slot-id',
          patientId: 'patient-id',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if patient does not belong to user', async () => {
      // Mock patient not found
      mockClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Patient not found' }
      });

      await expect(
        service.create('guest-id', {
          hostId: 'host-id',
          timeslotId: 'slot-id',
          patientId: 'patient-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if timeslot is not available', async () => {
      // Mock patient found
      mockClient.single.mockResolvedValueOnce({
        data: { id: 'patient-id', owner_id: 'guest-id', name: 'Test Patient' },
        error: null,
      });

      // Mock timeslot not available
      mockClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Timeslot not available' },
      });

      await expect(
        service.create('guest-id', {
          hostId: 'host-id',
          timeslotId: 'slot-id',
          patientId: 'patient-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create appointment successfully', async () => {
      const mockPatient = {
        id: 'patient-id',
        owner_id: 'guest-id',
        name: 'Test Patient',
        phone: '0123456789',
      };

      const mockTimeslot = {
        id: 'slot-id',
        host_id: 'host-id',
        is_available: true,
      };

      const mockAppointment = {
        id: 'appointment-id',
        host_id: 'host-id',
        guest_id: 'guest-id',
        patient_id: 'patient-id',
        patient_name: 'Test Patient',
        doctor_name: 'Dr. Test',
        phone: '0123456789',
        status: 'PENDING',
        payment_status: 'PENDING',
      };

      // Mock patient check
      mockClient.single.mockResolvedValueOnce({
        data: mockPatient,
        error: null,
      });

      // Mock timeslot check
      mockClient.single.mockResolvedValueOnce({
        data: mockTimeslot,
        error: null,
      });

      // Mock appointment creation
      mockClient.single.mockResolvedValueOnce({
        data: mockAppointment,
        error: null,
      });

      const result = await service.create('guest-id', {
        hostId: 'host-id',
        timeslotId: 'slot-id',
        patientId: 'patient-id',
        paymentAmount: 100000,
        paymentMethod: 'CREDIT_CARD',
      });

      expect(result).toEqual(mockAppointment);
    });
  });

  describe('mockPayment', () => {
    it('should update payment status to PAID', async () => {
      const mockAppointment = {
        id: 'appointment-id',
        guest_id: 'guest-id',
        payment_status: 'PENDING',
      };

      const updatedAppointment = {
        ...mockAppointment,
        payment_status: 'PAID',
        payment_method: 'CREDIT_CARD',
        payment_amount: 100000,
      };

      // Mock appointment check
      mockClient.single.mockResolvedValueOnce({
        data: mockAppointment,
        error: null,
      });

      // Mock payment update
      mockClient.single.mockResolvedValueOnce({
        data: updatedAppointment,
        error: null,
      });

      const result = await service.mockPayment(
        'appointment-id',
        'guest-id',
        { method: 'CREDIT_CARD', amount: 100000 },
      );

      expect(result.success).toBe(true);
      expect(result.data.payment_status).toBe('PAID');
    });
  });

  describe('getDoctorDashboard', () => {
    it('should return statistics for a given date', async () => {
      const mockAppointments = [
        { id: '1', status: 'CONFIRMED' },
        { id: '2', status: 'PENDING' },
        { id: '3', status: 'CANCELED' },
        { id: '4', status: 'CONFIRMED' },
      ];

      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: mockAppointments,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getDoctorDashboard('host-id', '2024-01-01');

      expect(result).toEqual({
        date: '2024-01-01',
        statistics: {
          total: 4,
          confirmed: 2,
          pending: 1,
          canceled: 1,
        },
      });
    });
  });
});
