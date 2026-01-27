import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../../mail';
import {
    AppointmentCreatedEvent,
    AppointmentConfirmedEvent,
    AppointmentCanceledEvent
} from '../appointment.events';

@Injectable()
export class AppointmentListener {
    private readonly logger = new Logger(AppointmentListener.name);

    constructor(private readonly mailService: MailService) { }

    @OnEvent('appointment.created')
    async handleAppointmentCreated(event: AppointmentCreatedEvent) {
        this.logger.log(`Handling appointment.created event for appointment ${event.appointmentId}`);

        // Send email to Host
        await this.mailService.sendAppointmentCreatedEmail(event.hostEmail, {
            hostName: event.hostName,
            guestName: event.guestName,
            guestEmail: event.guestEmail,
            date: event.date,
            time: event.time,
            reason: event.reason,
        });
    }

    @OnEvent('appointment.confirmed')
    async handleAppointmentConfirmed(event: AppointmentConfirmedEvent) {
        this.logger.log(`Handling appointment.confirmed event for appointment ${event.appointmentId}`);

        // Send email to Guest
        await this.mailService.sendAppointmentConfirmedEmail(event.guestEmail, {
            guestName: event.guestName,
            hostName: event.hostName,
            date: event.date,
            time: event.time,
        });
    }

    @OnEvent('appointment.canceled')
    async handleAppointmentCanceled(event: AppointmentCanceledEvent) {
        this.logger.log(`Handling appointment.canceled event for appointment ${event.appointmentId}`);

        // Send email to both parties
        const { hostEmail, guestEmail, canceledBy } = event;

        // Send to the other party (not the one who canceled)
        if (canceledBy === 'host') {
            await this.mailService.sendAppointmentCanceledEmail(guestEmail, {
                recipientName: event.guestName,
                otherPartyName: event.hostName,
                date: event.date,
                time: event.time,
                cancelReason: event.cancelReason,
                canceledBy: 'host',
            });
        } else {
            await this.mailService.sendAppointmentCanceledEmail(hostEmail, {
                recipientName: event.hostName,
                otherPartyName: event.guestName,
                date: event.date,
                time: event.time,
                cancelReason: event.cancelReason,
                canceledBy: 'guest',
            });
        }
    }
}
