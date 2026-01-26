import { Module } from '@nestjs/common';
import { AvailabilityRulesController } from './availability-rules.controller';
import { AvailabilityRulesService } from './availability-rules.service';
import { SupabaseModule } from '../supabase';

@Module({
    imports: [SupabaseModule],
    controllers: [AvailabilityRulesController],
    providers: [AvailabilityRulesService],
    exports: [AvailabilityRulesService],
})
export class AvailabilityRulesModule { }
