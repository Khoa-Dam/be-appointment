export class TimeSlot {
    id: string;
    ruleId?: string;
    hostId: string;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    createdAt: Date;

    // Derived properties for frontend
    date?: string;
    startLabel?: string;
    endLabel?: string;

    constructor(partial: Partial<TimeSlot>) {
        Object.assign(this, partial);
    }
}
