import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase';

@Controller()
export class AppController {
  constructor(private readonly supabase: SupabaseService) { }

  @Get()
  root() {
    return {
      name: 'Appointment & Schedule System API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: 'GET /health',
        auth: 'POST /auth/register, POST /auth/login',
        users: 'GET /users, GET /hosts',
        appointments: 'GET /appointments/my',
      },
    };
  }

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
}
