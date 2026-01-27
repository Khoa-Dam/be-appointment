import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class GenerateTimeslotsDto {
    @ApiProperty({
        description: 'The ID of the Availability Rule to use',
        example: '550e8400-e29b-41d4-a716-446655440000'
    })
    @IsString()
    @IsNotEmpty()
    ruleId: string;

    @ApiProperty({
        description: 'Duration of each slot in minutes',
        example: 30,
        minimum: 1
    })
    @IsInt()
    @Min(1)
    slotDuration: number;

    @ApiProperty({
        description: 'Start date for generation (YYYY-MM-DD)',
        example: '2026-01-28'
    })
    @IsDateString()
    fromDate: string;

    @ApiProperty({
        description: 'End date for generation (YYYY-MM-DD)',
        example: '2026-01-31'
    })
    @IsDateString()
    toDate: string;
}
