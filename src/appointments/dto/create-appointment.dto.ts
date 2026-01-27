import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
    @ApiProperty({ example: 'uuid-of-host', description: 'Host ID to book with' })
    @IsUUID()
    @IsNotEmpty()
    hostId: string;

    @ApiProperty({ example: 'uuid-of-timeslot', description: 'TimeSlot ID to book' })
    @IsUUID()
    @IsNotEmpty()
    timeSlotId: string;

    @ApiPropertyOptional({ example: 'Tư vấn sức khỏe', description: 'Reason for appointment' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;

    // Fields for anonymous guests
    @ApiPropertyOptional({ example: 'Alice Guest', description: 'Name (for anonymous booking)' })
    @IsOptional()
    @IsString()
    guestName?: string;

    @ApiPropertyOptional({ example: 'alice@example.com', description: 'Email (for anonymous booking)' })
    @IsOptional()
    @IsString() // Can verify email format in service or pipe if needed
    guestEmail?: string;

    @ApiPropertyOptional({ example: '0987654321', description: 'Phone (for anonymous booking)' })
    @IsOptional()
    @IsString()
    guestPhone?: string;
}
