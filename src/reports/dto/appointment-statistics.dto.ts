import { ApiProperty } from '@nestjs/swagger';

export class AppointmentStatisticsDto {
    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 70 })
    confirmed: number;

    @ApiProperty({ example: 30 })
    canceled: number;
}
