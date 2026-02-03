import {
  IsOptional,
  IsString,
  IsEmail,
  MaxLength,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'User email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '0912345678',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Some address', description: 'User address' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({
    example: 'Dental',
    description: 'Host specialty (legacy field)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @ApiPropertyOptional({
    example: 'Professional description',
    description: 'User description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  // New doctor fields
  @ApiPropertyOptional({
    example: 'Dr.',
    description: 'Professional title (for doctors)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-specialty',
    description: 'Specialty ID (foreign key to specialties)',
  })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Consultation price',
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;
}
