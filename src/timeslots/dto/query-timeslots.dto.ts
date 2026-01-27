import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryTimeslotsDto {
    @ApiPropertyOptional({
        description: 'Filter available slots by Host ID',
        example: '550e8400-e29b-41d4-a716-446655440000'
    })
    @IsString()
    @IsUUID()
    @IsOptional() // Make it optional to allow other queries later
    hostId?: string;
}
