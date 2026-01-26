import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { RegisterDto, LoginDto } from './dto';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
    constructor(private readonly supabase: SupabaseService) { }

    async register(dto: RegisterDto) {
        const client = this.supabase.getClient();

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await client.auth.signUp({
            email: dto.email,
            password: dto.password,
            options: {
                data: {
                    name: dto.name,
                    role: dto.role,
                },
            },
        });

        if (authError) {
            throw new BadRequestException(authError.message);
        }

        if (!authData.user) {
            throw new BadRequestException('Failed to create user');
        }

        // 2. Create user in public.users table
        const userData: any = {
            id: authData.user.id,
            email: dto.email,
            name: dto.name,
            role: dto.role,
            is_active: true,
            phone: dto.phone,
        };

        // Add host-specific fields
        if (dto.role === UserRole.HOST) {
            userData.specialty = dto.specialty;
            userData.description = dto.description;
            userData.address = dto.address;
        }

        const { data: user, error: dbError } = await client
            .from('users')
            .insert(userData)
            .select()
            .single();

        if (dbError) {
            // Rollback: delete auth user if DB insert fails
            await client.auth.admin.deleteUser(authData.user.id);
            throw new BadRequestException(dbError.message);
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.created_at,
        };
    }

    async login(dto: LoginDto) {
        const client = this.supabase.getClient();

        const { data, error } = await client.auth.signInWithPassword({
            email: dto.email,
            password: dto.password,
        });

        if (error) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!data.user || !data.session) {
            throw new UnauthorizedException('Login failed');
        }

        // Get user details from public.users
        const { data: userData } = await client
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                role: userData?.role || 'GUEST',
                name: userData?.name,
            },
        };
    }

    async logout(accessToken: string) {
        const client = this.supabase.getClient();

        const { error } = await client.auth.signOut();

        if (error) {
            throw new BadRequestException('Logout failed');
        }

        return {
            message: 'Logged out successfully',
        };
    }

    async getCurrentUser(userId: string) {
        const client = this.supabase.getClient();

        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            throw new UnauthorizedException('User not found');
        }

        return data;
    }
}
