import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { UserRole } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  // GET /users - Admin: list all users with pagination
  async findAll(page = 1, limit = 20, role?: UserRole) {
    const client = this.supabase.getClient();
    const offset = (page - 1) * limit;

    let query = client
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // PATCH /users/:id/status - Admin: enable/disable user
  async updateStatus(userId: string, isActive: boolean) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return data;
  }

  // GET /hosts - Guest: list all hosts
  async findHosts(page = 1, limit = 20, specialty?: string) {
    const client = this.supabase.getClient();
    const offset = (page - 1) * limit;

    let query = client
      .from('users')
      .select(
        'id, name, email, specialty, description, address, is_active, created_at',
        { count: 'exact' },
      )
      .eq('role', UserRole.HOST)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (specialty) {
      query = query.ilike('specialty', `%${specialty}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // GET /hosts/:id - Guest: get host detail with availability
  async findHostById(hostId: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('users')
      .select(
        'id, name, email, specialty, description, address, phone, is_active, created_at',
      )
      .eq('id', hostId)
      .eq('role', UserRole.HOST)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Host with ID ${hostId} not found`);
    }

    // Get availability rules for this host
    const { data: rules } = await client
      .from('availability_rules')
      .select('*')
      .eq('host_id', hostId)
      .eq('is_active', true);

    return {
      ...data,
      availabilityRules: rules || [],
    };
  }

  // POST /users/become-host - Guest: upgrade to host
  async becomeHost(
    userId: string,
    hostData: { specialty: string; description?: string; address?: string },
  ) {
    const client = this.supabase.getClient();

    // Verify user exists and is GUEST
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.GUEST) {
      throw new BadRequestException('Only GUEST users can become HOST');
    }

    // Update user to HOST
    const { data, error } = await client
      .from('users')
      .update({
        role: UserRole.HOST,
        specialty: hostData.specialty,
        description: hostData.description,
        address: hostData.address,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  // PATCH /users/:id - User: update their own profile
  async update(userId: string, updateData: any) {
    const client = this.supabase.getClient();

    // Verify user exists
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new NotFoundException('User not found');
    }

    // Build update object with only provided fields
    const updateObj: any = {};
    if (updateData.name !== undefined) updateObj.name = updateData.name;
    if (updateData.email !== undefined) updateObj.email = updateData.email;
    if (updateData.phone !== undefined) updateObj.phone = updateData.phone;
    if (updateData.address !== undefined)
      updateObj.address = updateData.address;
    if (updateData.specialty !== undefined)
      updateObj.specialty = updateData.specialty;
    if (updateData.description !== undefined)
      updateObj.description = updateData.description;

    const { data, error } = await client
      .from('users')
      .update(updateObj)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
