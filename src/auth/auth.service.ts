import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { RegisterDto, LoginDto } from './dto';
import { UserRole } from '../common/enums';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(dto: RegisterDto) {
    // Use admin client for registration (auto-confirm email, proper rollback)
    const adminClient = this.supabase.getAdminClient();

    // 1. Create user in Supabase Auth with admin API
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true, // Auto-confirm for development
        user_metadata: {
          name: dto.name,
          role: dto.role || UserRole.GUEST, // Default role is GUEST
        },
      });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new BadRequestException('Failed to create user');
    }

    // 2. Create user in public.users table (always GUEST by default)
    const userData: Partial<User> = {
      id: authData.user.id,
      email: dto.email,
      name: dto.name,
      role: dto.role || UserRole.GUEST, // Default role is GUEST, admin can change later
      is_active: true,
      phone: dto.phone,
    };
    // Note: Host-specific fields (specialty, description, address) are set later by admin

    const { data: user, error: dbError } = await adminClient
      .from('users')
      .upsert(userData)
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if DB insert fails (admin client)
      await adminClient.auth.admin.deleteUser(authData.user.id);
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
