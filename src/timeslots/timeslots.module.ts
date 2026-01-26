import { Module } from '@nestjs/common';
import { TimeslotsController } from './timeslots.controller';
import { TimeslotsService } from './timeslots.service';
import { SupabaseModule } from '../supabase';

@Module({
    imports: [SupabaseModule],
    controllers: [TimeslotsController],
    providers: [TimeslotsService],
    exports: [TimeslotsService],
})
export class TimeslotsModule { }
