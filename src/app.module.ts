import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { AvailabilityRulesModule } from './availability-rules/availability-rules.module';
import { TimeslotsModule } from './timeslots/timeslots.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events';
import { configuration } from './config';
import { SpecialtiesModule } from './specialties/specialties.module';
import { PatientsModule } from './patients/patients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    SupabaseModule,
    EventsModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    AvailabilityRulesModule,
    TimeslotsModule,
    AppointmentsModule,
    NotificationsModule,
    SpecialtiesModule,
    PatientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
