import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { SupabaseService } from './supabase.service';
import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseGuard } from './supabase.guard';

@Global() // Để dùng được ở mọi nơi mà không cần import lại
@Module({
    imports: [ConfigModule, PassportModule],
    providers: [SupabaseService, SupabaseStrategy, SupabaseGuard],
    exports: [SupabaseService, SupabaseGuard, SupabaseStrategy],
})
export class SupabaseModule { }
