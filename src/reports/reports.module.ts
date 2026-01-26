import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SupabaseModule } from '../supabase';

@Module({
    imports: [SupabaseModule],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }
