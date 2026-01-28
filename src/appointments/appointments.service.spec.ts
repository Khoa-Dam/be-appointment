
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { SupabaseService } from '../supabase';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException } from '@nestjs/common';

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
    it('should throw ConflictException if slot is already booked', async () => {
      // Mock validation fail (Slot check found no valid free slot)
      mockClient.single.mockResolvedValueOnce({ data: null, error: null }); 

      await expect(
        service.create('guest-id', {
            hostId: 'host-id',
            timeSlotId: 'slot-id',
            reason: 'Test',
            guestName: 'Guest',
            guestEmail: 'guest@test.com',
            guestPhone: '000'
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
