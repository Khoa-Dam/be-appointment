import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAppointmentsByRangeDto {
    @ApiProperty({
        description: 'Start date (YYYY-MM-DD format)',
        example: '2024-01-01',
    })
    @IsDateString()
    startDate: string;

    @ApiProperty({
        description: 'End date (YYYY-MM-DD format)',
        example: '2024-01-31',
    })
    @IsDateString()
    endDate: string;
}
