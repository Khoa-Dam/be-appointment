import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let hostToken: string;
  let guestToken: string;
  let hostId: string;
  let guestId: string;
  let patientId: string;
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
      const today = new Date();
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(today.getDate() + 3);

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

  describe('2. Guest Registration & Patient Profile', () => {
    it('[TC_05] /auth/register (POST) - Register Guest', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send(guestData)
        .expect(201);

      guestId = response.body.id;
    });

    it('[TC_06] /auth/login (POST) - Login Guest', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({ email: guestData.email, password: guestData.password })
        .expect(200);

      guestToken = response.body.accessToken;
      expect(guestToken).toBeDefined();
    });

    it('[TC_07] /patients (POST) - Create Patient Profile', async () => {
      const response = await request(server)
        .post('/patients')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Test Patient',
          email: 'patient@test.com',
          phone: '0123456789',
          dob: '1990-01-01',
          gender: 'MALE',
        })
        .expect(201);

      patientId = response.body.id;
      expect(response.body.name).toBe('Test Patient');
    });

    it('[TC_08] /patients (GET) - Get My Patients', async () => {
      const response = await request(server)
        .get('/patients')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const patient = response.body.find((p: any) => p.id === patientId);
      expect(patient).toBeDefined();
    });
  });

  describe('3. Specialties & Host Search', () => {
    it('[TC_09] /specialties (GET) - Get Specialties', async () => {
      const response = await request(server)
        .get('/specialties')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('icon');
    });

    it('[TC_10] /hosts (GET) - Search Hosts', async () => {
      const response = await request(server)
        .get('/hosts')
        .expect(200);

      const foundHost = response.body.data.find((h: any) => h.id === hostId);
      expect(foundHost).toBeDefined();
    });

    it('[TC_11] /timeslots/host/:id (GET) - Get Host Slots', async () => {
      const response = await request(server)
        .get(`/timeslots/host/${hostId}`)
        .expect(200);

      const availableSlot = response.body.find((s: any) => s.isAvailable);
      expect(availableSlot).toBeDefined();
      timeSlotId = availableSlot.id;
    });
  });

  describe('4. Booking Flow with Patient', () => {
    it('[TC_12] /appointments (POST) - Create Appointment (with patientId)', async () => {
      const response = await request(server)
        .post('/appointments')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hostId: hostId,
          timeslotId: timeSlotId,
          patientId: patientId,
          paymentAmount: 100000,
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(201);

      appointmentId = response.body.id;
      expect(response.body.status).toBe('PENDING');
      expect(response.body.payment_status).toBe('PENDING');
      expect(response.body.patient_name).toBe('Test Patient');
    });

    it('[TC_13] /appointments/:id/pay (POST) - Mock Payment', async () => {
      const response = await request(server)
        .post(`/appointments/${appointmentId}/pay`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          method: 'CREDIT_CARD',
          amount: 100000,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment_status).toBe('PAID');
    });

    it('[TC_14] /appointments/my (GET) - Guest Checks Appointment', async () => {
      const response = await request(server)
        .get('/appointments/my')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      const appointment = response.body.find((a: any) => a.id === appointmentId);
      expect(appointment).toBeDefined();
      expect(appointment.payment_status).toBe('PAID');
    });
  });

  describe('5. Host Actions', () => {
    it('[TC_15] /appointments/:id/confirm (PATCH) - Host Confirms', async () => {
      const response = await request(server)
        .patch(`/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });

    it('[TC_16] /appointments/doctor/dashboard (GET) - Dashboard Stats', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(server)
        .get(`/appointments/doctor/dashboard?date=${today}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('total');
    });

    it('[TC_17] /appointments/doctor/today (GET) - Today Appointments', async () => {
      const response = await request(server)
        .get('/appointments/doctor/today')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('6. Error Handling', () => {
    it('[TC_18] /appointments (POST) - Fail without patientId', async () => {
      await request(server)
        .post('/appointments')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hostId: hostId,
          timeslotId: timeSlotId,
          // Missing patientId
        })
        .expect(400);
    });

    it('[TC_19] /appointments (POST) - Fail with invalid patientId', async () => {
      await request(server)
        .post('/appointments')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          hostId: hostId,
          timeslotId: timeSlotId,
          patientId: 'invalid-patient-id',
        })
        .expect(400);
    });

    it('[TC_20] /patients (POST) - Fail to create 6th patient', async () => {
      // Create 4 more patients (already have 1)
      for (let i = 0; i < 4; i++) {
        await request(server)
          .post('/patients')
          .set('Authorization', `Bearer ${guestToken}`)
          .send({
            name: `Patient ${i + 2}`,
            phone: `012345678${i}`,
          })
          .expect(201);
      }

      // Try to create 6th
      await request(server)
        .post('/patients')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          name: 'Patient 6',
          phone: '0123456786',
        })
        .expect(400);
    });
  });

  describe('7. Cancellation', () => {
    it('[TC_21] /appointments/:id/cancel (PATCH) - Cancel Appointment', async () => {
      const response = await request(server)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ cancelReason: 'Test cancellation' })
        .expect(200);

      expect(response.body.status).toBe('CANCELED');
    });

    it('[TC_22] /timeslots/host/:id (GET) - Slot available again', async () => {
      const response = await request(server)
        .get(`/timeslots/host/${hostId}`)
        .expect(200);

      const slot = response.body.find((s: any) => s.id === timeSlotId);
      expect(slot.isAvailable).toBe(true);
    });
  });
});
