export class TimeSlot {
    id: string;
    ruleId?: string;
    hostId: string;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    createdAt: Date;

    constructor(partial: Partial<TimeSlot>) {
        Object.assign(this, partial);
    }
}
