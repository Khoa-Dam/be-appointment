import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import type { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExtractJwt } from 'passport-jwt';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
    private readonly logger = new Logger(SupabaseService.name);
    private clientInstance: SupabaseClient;

    constructor(
        @Inject(REQUEST) private readonly request: Request,
        private readonly configService: ConfigService,
    ) { }

    getClient(): SupabaseClient {
        if (this.clientInstance) {
            return this.clientInstance;
        }

        this.logger.log('Initializing Supabase Client for current request');

        // 1. Lấy Token từ Header
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(this.request);

        // 2. Lấy config values và validate
        const supabaseUrl = this.configService.get<string>('supabase.url');
        const supabaseKey = this.configService.get<string>('supabase.anonKey');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('supabase.url and supabase.anonKey must be defined in configuration');
        }

        // 3. Tạo Client với Global Headers (Cách chuẩn của v2)
        this.clientInstance = createClient(
            supabaseUrl,
            supabaseKey,
            {
                auth: {
                    persistSession: false, // Server không cần lưu session
                    autoRefreshToken: false, // Server không tự refresh token
                    detectSessionInUrl: false,
                },
                global: {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                },
            },
        );

        return this.clientInstance;
    }

    getAdminClient(): SupabaseClient {
        const supabaseUrl = this.configService.get<string>('supabase.url');
        const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('supabase.url and supabase.serviceRoleKey must be defined in configuration');
        }

        return createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        });
    }
}
