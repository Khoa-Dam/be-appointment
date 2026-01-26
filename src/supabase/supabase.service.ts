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

        // 2. Lấy env variables và validate
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined');
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
}
