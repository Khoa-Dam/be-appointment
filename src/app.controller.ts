import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from './supabase';
import { CurrentUser, Roles } from './common/decorators';
import { RolesGuard } from './common/guards';

@Controller()
export class AppController {
  // ✅ Public route - không cần authentication
  @Get()
  getHello(): string {
    return 'Hello World! Appointment System is running!';
  }

  // ✅ Protected route - cần authentication
  @Get('profile')
  @UseGuards(SupabaseGuard)
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'This is your profile',
      user: {
        id: user.sub,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ✅ Admin only route
  @Get('admin')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('ADMIN')
  adminOnly(@CurrentUser() user: any) {
    return {
      message: 'Welcome Admin!',
      admin: user.email,
    };
  }

  // ✅ Host only route
  @Get('host-dashboard')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('HOST')
  hostDashboard(@CurrentUser() user: any) {
    return {
      message: 'Host Dashboard',
      host: user.email,
    };
  }

  // ✅ Host hoặc Admin mới vào được
  @Get('manage-availability')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  manageAvailability(@CurrentUser() user: any) {
    return {
      message: 'Manage Availability',
      user: user.email,
      role: user.role,
    };
  }
}
