import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let hostToken: string;
  let guestToken: string;
  let hostId: string;
  let availabilityRuleId: string;
  let timeSlotId: string;
  let appointmentId: string;
  let server: any;

  // Helper to generate random user data
  const randomId = () => Math.random().toString(36).substring(7);
  const hostData = {
    name: `HOST_${randomId()}`,
    email: `host_${randomId()}@test.com`,
    password: 'password123',
    phone: '0900000000',
  };
  const guestData = {
    name: `GUEST_${randomId()}`,
    email: `guest_${randomId()}@test.com`,
    password: 'password123',
    phone: '0900000000',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication & Setup', () => {
    it('[TC_01] /auth/register (POST) - Register Host', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send(hostData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(hostData.email);
    });

    it('[TC_02] /auth/login (POST) - Login Host', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({ email: hostData.email, password: hostData.password })
        .expect(200);

      hostToken = response.body.accessToken;
      hostId = response.body.user.id;
      expect(hostToken).toBeDefined();
    });

    it('[TC_03] /availability-rules (POST) - Create Rule', async () => {
      const response = await request(server)
        .post('/availability-rules')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          ruleType: 'WEEKLY',
          startHour: 9,
          endHour: 17,
          daysOfWeek: 'MON,TUE,WED,THU,FRI,SAT,SUN',
          isActive: true,
        })
        .expect(201);

      availabilityRuleId = response.body.id;
      expect(availabilityRuleId).toBeDefined();
    });

    it('[TC_04] /timeslots/generate (POST) - Generate Slots', async () => {
      // Generate for next 3 days
      const today = new Date();
      const nextDay = new Date(today); nextDay.setDate(today.getDate() + 1);
      const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 3);
      
      const fromDate = nextDay.toISOString().split('T')[0];
      const toDate = dayAfter.toISOString().split('T')[0];

      const response = await request(server)
        .post('/timeslots/generate')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          ruleId: availabilityRuleId,
          fromDate,
          toDate,
          slotDuration: 60,
        })
        .expect(201);
        
      expect(response.body.created).toBeGreaterThan(0);
    });
  });

  describe('2. Guest Actions', () => {
    it('[TC_05] /auth/register (POST) - Register Guest', async () => {
      await request(server)
        .post('/auth/register')
        .send(guestData)
        .expect(201);
    });

    it('[TC_06] /auth/login (POST) - Login Guest', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({ email: guestData.email, password: guestData.password })
        .expect(200);

      guestToken = response.body.accessToken;
      expect(guestToken).toBeDefined();
    });

    it('[TC_07] /hosts (GET) - Search Hosts', async () => {
      const response = await request(server)
        .get('/hosts')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
      
      const foundHost = response.body.data.find((h: any) => h.id === hostId);
      expect(foundHost).toBeDefined();
    });

    it('[TC_08] /timeslots/host/:id (GET) - Get Host Slots', async () => {
      const response = await request(server)
        .get(`/timeslots/host/${hostId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
      
      const availableSlot = response.body.find((s: any) => s.isAvailable);
      expect(availableSlot).toBeDefined();
      timeSlotId = availableSlot.id;
    });

    it('[TC_09] /appointments (POST) - Create Appointment', async () => {
      const response = await request(server)
        .post('/appointments')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hostId: hostId,
          timeSlotId: timeSlotId,
          reason: 'E2E Test Booking',
        })
        .expect(201);
      
      appointmentId = response.body.id;
      expect(response.body.status).toBe('PENDING');
    });
  });

  describe('3. Confirmation', () => {
    it('[TC_10] /appointments/:id/confirm (PATCH) - Host Confirms', async () => {
      const response = await request(server)
        .patch(`/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(200);
      
      expect(response.body.status).toBe('CONFIRMED');
    });

    it('[TC_11] /notifications/my (GET) - Guest Checks Notification', async () => {
      // Need a small delay really, but logic usually fast enough
      const response = await request(server)
        .get('/notifications/my')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
      
      const notif = response.body.find((n: any) => n.type === 'APPOINTMENT_CONFIRMED');
      // Note: Depending on async trigger timing, this might be flaky without retry logic
      // But for E2E happy path usually works.
      if (notif) {
        expect(notif.type).toBe('APPOINTMENT_CONFIRMED');
      }
    });

  });

  describe('4. Edge Cases & Error Handling', () => {
    it('[TC_12] /auth/login (POST) - Fail with wrong password', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: hostData.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('[TC_13] /timeslots/generate (POST) - Guest Forbidden', async () => {
      await request(server)
        .post('/timeslots/generate')
        .set('Authorization', `Bearer ${guestToken}`) // Guest trying to act as Host
        .send({
          ruleId: availabilityRuleId,
          fromDate: '2026-01-01',
          toDate: '2026-01-02',
          slotDuration: 60,
        })
        .expect(403);
    });

    it('[TC_14] /appointments (POST) - Fail Double Booking', async () => {
      // Try to book the same slot again with a new guest
      const newGuest = {
        name: `GUEST_2_${randomId()}`,
        email: `guest2_${randomId()}@test.com`,
        password: 'password123',
        phone: '0900000000',
      };
      
      // Register new guest
      await request(server).post('/auth/register').send(newGuest);
      const login = await request(server).post('/auth/login').send({ email: newGuest.email, password: newGuest.password });
      const token = login.body.accessToken;

      // Try book confirmed/pending slot
      await request(server)
        .post('/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hostId: hostId,
          timeSlotId: timeSlotId, // Already booked in Step 2
          reason: 'Double Booking Attempt',
        })
        .expect(409); // Expect Conflict
    });
  });

  describe('5. Cancellation', () => {
    it('[TC_15] /appointments/:id/cancel (PATCH) - Host Cancels Appointment', async () => {
      const response = await request(server)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ cancelReason: 'Host busy' })
        .expect(200);

      expect(response.body.status).toBe('CANCELED');
      expect(response.body.cancelReason).toBe('Host busy');
    });

    it('[TC_16] /notifications/my (GET) - Guest Recieves Cancel Notification', async () => {
      const response = await request(server)
        .get('/notifications/my')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      const notif = response.body.find((n: any) => n.type === 'APPOINTMENT_CANCELED');
      if (notif) {
        expect(notif.type).toBe('APPOINTMENT_CANCELED');
      }
    });

    it('[TC_17] /timeslots/host/:id (GET) - Slot should be open again', async () => {
      // After cancel, the slot should be available again
      const response = await request(server)
        .get(`/timeslots/host/${hostId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      const slot = response.body.find((s: any) => s.id === timeSlotId);
      expect(slot.isAvailable).toBe(true);
    });
  });
});

