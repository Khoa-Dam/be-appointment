import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { UserRole } from '../../common/enums';

export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;

    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsEnum(UserRole, { message: 'Role must be ADMIN, HOST, or GUEST' })
    role: UserRole;

    @IsOptional()
    phone?: string;

    // Host-specific fields
    @IsOptional()
    specialty?: string;

    @IsOptional()
    description?: string;

    @IsOptional()
    address?: string;
}
