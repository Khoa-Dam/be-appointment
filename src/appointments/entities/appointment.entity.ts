import { AppointmentStatus } from '../../common/enums';

export class Appointment {
    id: string;
    hostId: string;
    guestId: string;
    timeslotId?: string;
    status: AppointmentStatus;
    reason?: string;
    cancelReason?: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<Appointment>) {
        Object.assign(this, partial);
    }
}
