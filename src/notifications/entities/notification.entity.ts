import { NotificationType } from '../../common/enums';

export class Notification {
    id: string;
    recipientId: string;
    type: NotificationType;
    appointmentId?: string;
    status: 'SENT' | 'READ';
    sentAt: Date;

    constructor(partial: Partial<Notification>) {
        Object.assign(this, partial);
    }
}
