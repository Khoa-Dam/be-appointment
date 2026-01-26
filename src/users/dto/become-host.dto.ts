import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BecomeHostDto {
    @ApiProperty({ example: 'Dental', description: 'Host specialty' })
    @IsNotEmpty({ message: 'Specialty is required' })
    @IsString()
    @MaxLength(100)
    specialty: string;

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
