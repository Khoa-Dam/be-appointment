import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber } from 'class-validator';

export class CreateAppointmentDto {
    @ApiProperty({ example: 'uuid-of-host', description: 'Host/Doctor ID' })
    @IsUUID()
    hostId: string;

    @ApiProperty({ example: 'uuid-of-timeslot', description: 'Timeslot ID' })
    @IsUUID()
    timeslotId: string;

    @ApiProperty({ example: 'uuid-of-patient', description: 'Patient profile ID' })
    @IsUUID()
    patientId: string;

    @ApiPropertyOptional({ example: 100000, description: 'Payment amount' })
    @IsOptional()
    @IsNumber()
    paymentAmount?: number;

    @ApiPropertyOptional({ example: 'CREDIT_CARD', description: 'Payment method' })
    @IsOptional()
    paymentMethod?: string;
}
