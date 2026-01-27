import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeSlot {
    @ApiProperty({ description: 'The unique identifier of the timeslot' })
    id: string;

    @ApiPropertyOptional({ description: 'The ID of the rule that generated this slot' })
    ruleId?: string;

    @ApiProperty({ description: 'The ID of the host' })
    hostId: string;

    @ApiProperty({ description: 'Start time of the slot' })
    startTime: Date;

    @ApiProperty({ description: 'End time of the slot' })
    endTime: Date;

    @ApiProperty({ description: 'Availability status' })
    isAvailable: boolean;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    // Derived properties for frontend
    @ApiPropertyOptional({ description: 'Formatted date (YYYY-MM-DD)' })
    date?: string;

    @ApiPropertyOptional({ description: 'Formatted start time (HH:mm)' })
    startLabel?: string;

    @ApiPropertyOptional({ description: 'Formatted end time (HH:mm)' })
    endLabel?: string;

    constructor(partial: Partial<TimeSlot>) {
        Object.assign(this, partial);
    }
}
