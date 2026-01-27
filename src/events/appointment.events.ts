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
}

export class AppointmentConfirmedEvent {
    appointmentId: string;
    hostName: string;
    guestName: string;
    guestEmail: string;
    date: string;
    time: string;
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
}
