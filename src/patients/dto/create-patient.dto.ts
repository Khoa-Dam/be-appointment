import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreatePatientDto {
    @ApiProperty({ example: 'Nguyễn Văn A' })
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'patient@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: '+84123456789' })
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: '123 Main St, Hanoi' })
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: '1990-01-01' })
    @IsOptional()
    @IsDateString()
    dob?: string;

    @ApiPropertyOptional({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
    @IsOptional()
    @IsEnum(['MALE', 'FEMALE', 'OTHER'])
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
}
