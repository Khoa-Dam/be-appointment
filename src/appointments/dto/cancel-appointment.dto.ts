import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelAppointmentDto {
    @ApiPropertyOptional({ example: 'Schedule conflict', description: 'Reason for cancellation' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    cancelReason?: string;
}
