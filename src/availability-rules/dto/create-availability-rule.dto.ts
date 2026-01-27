import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { RuleType } from '../../common/enums';

export class CreateAvailabilityRuleDto {
    @ApiPropertyOptional({
        description: 'Type of the rule (WEEKLY, SPECIFIC_DATE)',
        enum: RuleType,
        default: RuleType.WEEKLY
    })
    @IsEnum(RuleType)
    @IsOptional()
    ruleType?: RuleType;

    @ApiProperty({
        description: 'Days of week to apply rule (comma separated)',
        example: 'MON,TUE,WED,THU,FRI'
    })
    @IsString()
    @IsOptional()
    daysOfWeek?: string;

    @ApiProperty({
        description: 'Start hour of the day (0-23)',
        example: 9,
        minimum: 0,
        maximum: 23
    })
    @IsInt()
    @Min(0)
    @Max(23)
    startHour: number;

    @ApiProperty({
        description: 'End hour of the day (0-23)',
        example: 17,
        minimum: 0,
        maximum: 23
    })
    @IsInt()
    @Min(0)
    @Max(23)
    endHour: number;

    @ApiPropertyOptional({
        description: 'Is the rule active?',
        default: true
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    // --- Host Profile Fields (Auto-Upgrade) ---
    @ApiPropertyOptional({ example: 'Dental', description: 'Host specialty (Required if upgrading to Host)' })
    @IsOptional() // Optional because existing hosts might not send it, or system might tolerate null
    @IsString()
    @MaxLength(100)
    specialty?: string;

    @ApiPropertyOptional({ example: 'Experienced dental specialist', description: 'Host description' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({ example: '123 Main Street', description: 'Business address' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    address?: string;
}
