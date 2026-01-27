import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppointmentListener } from './listeners/appointment.listener';
import { MailModule } from '../mail';

@Module({
    imports: [
        EventEmitterModule.forRoot(),
        MailModule,
    ],
    providers: [AppointmentListener],
})
export class EventsModule { }
