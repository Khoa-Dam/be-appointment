// Event payloads for appointments
export class AppointmentCreatedEvent {
    appointmentId: string;
    hostId: string;
    hostName: string;
    hostEmail: string;
    guestId: string;
    guestName: string;
    guestEmail: string;
    date: string;
    time: string;
    reason?: string;
    constructor(init?: Partial<AppointmentCreatedEvent>) {
        Object.assign(this, init);
    }
}

export class AppointmentConfirmedEvent {
    appointmentId: string;
    hostName: string;
    guestName: string;
    guestEmail: string;
    date: string;
    time: string;

    constructor(init?: Partial<AppointmentConfirmedEvent>) {
        Object.assign(this, init);
    }
}

export class AppointmentCanceledEvent {
    appointmentId: string;
    hostId: string;
    hostName: string;
    hostEmail: string;
    guestId: string;
    guestName: string;
    guestEmail: string;
    date: string;
    time: string;
    cancelReason?: string;
    canceledBy: 'host' | 'guest';

    constructor(init?: Partial<AppointmentCanceledEvent>) {
        Object.assign(this, init);
    }
}
