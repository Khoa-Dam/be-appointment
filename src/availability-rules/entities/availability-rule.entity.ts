import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RuleType } from '../../common/enums';

export class AvailabilityRule {
    @ApiProperty({ description: 'The unique identifier of the rule' })
    id: string;

    @ApiProperty({ description: 'The ID of the host' })
    hostId: string;

    @ApiProperty({ description: 'Type of the rule', enum: RuleType })
    ruleType: RuleType;

    @ApiProperty({ description: 'Start hour (0-23)' })
    startHour: number;

    @ApiProperty({ description: 'End hour (0-23)' })
    endHour: number;

    @ApiPropertyOptional({ description: 'Days of week (comma separated)' })
    daysOfWeek?: string;

    @ApiProperty({ description: 'Is rule active' })
    isActive: boolean;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: Date;

    constructor(partial: Partial<AvailabilityRule>) {
        Object.assign(this, partial);
    }
}
