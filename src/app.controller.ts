import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseGuard, SupabaseService } from './supabase';
import { CurrentUser, Roles } from './common/decorators';
import { RolesGuard } from './common/guards';

@Controller()
export class AppController {
  constructor(private readonly supabase: SupabaseService) { }

  // ✅ Public route - không cần authentication
  @Get()
  getHello(): string {
    return 'Hello World! Appointment System is running!';
  }

  // ✅ Test database connection
  @Get('test-db')
  async testDatabase() {
    try {
      const client = this.supabase.getClient();

      const { data, error } = await client
        .from('users')
        .select('count');

      if (error) {
        return {
          success: false,
          error: error.message,
          hint: 'Make sure to run migration SQL in Supabase Dashboard first!'
        };
      }

      return {
        success: true,
        message: '✅ Database connected!',
        usersCount: data?.[0]?.count || 0,
        tables: ['users', 'availability_rules', 'timeslots', 'appointments', 'notifications']
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        hint: 'Check .env file has correct credentials'
      };
    }
  }

  // ✅ Health check endpoint
  @Get('health')
  async healthCheck() {
    const startTime = Date.now();

    // Check database
    let dbStatus = 'unknown';
    let dbResponseTime = 0;

    try {
      const dbStart = Date.now();
      const client = this.supabase.getClient();
      const { error } = await client.from('users').select('count').limit(1);
      dbResponseTime = Date.now() - dbStart;
      dbStatus = error ? 'unhealthy' : 'healthy';
    } catch (err) {
      dbStatus = 'unhealthy';
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    };

    // Uptime
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeFormatted = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;

    const totalResponseTime = Date.now() - startTime;

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: uptimeFormatted,
      checks: {
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`,
        },
        memory: {
          status: memoryMB.heapUsed < 500 ? 'healthy' : 'warning',
          rss: `${memoryMB.rss}MB`,
          heapUsed: `${memoryMB.heapUsed}MB`,
          heapTotal: `${memoryMB.heapTotal}MB`,
        },
        nodejs: {
          version: process.version,
          platform: process.platform,
        },
      },
      responseTime: `${totalResponseTime}ms`,
    };
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
