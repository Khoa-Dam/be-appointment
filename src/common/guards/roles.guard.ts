import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private supabaseService: SupabaseService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.sub) {
            throw new ForbiddenException('User not authenticated');
        }

        // Fetch actual role from database (not from JWT which may be stale)
        // Fetch actual role from database (not from JWT which may be stale)
        // Use Admin Client to bypass RLS policies and ensure we get the latest data
        const client = this.supabaseService.getAdminClient();
        const { data: dbUser, error } = await client
            .from('users')
            .select('role')
            .eq('id', user.sub)
            .single();

        if (error || !dbUser) {
            console.error(`DEBUG: RolesGuard - User not found. ID: ${user.sub}`, error);
            throw new ForbiddenException('User not found in database');
        }

        const hasRole = requiredRoles.some((role) => dbUser.role === role);

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`,
            );
        }

        // Attach database role to request for downstream use
        request.user.role = dbUser.role;

        return true;
    }
}
