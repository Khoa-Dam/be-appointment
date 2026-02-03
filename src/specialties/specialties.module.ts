import { Module } from '@nestjs/common';
import { SpecialtiesController } from './specialties.controller';
import { SpecialtiesService } from './specialties.service';
import { SupabaseModule } from '../supabase';

@Module({
    imports: [SupabaseModule],
    controllers: [SpecialtiesController],
    providers: [SpecialtiesService],
    exports: [SpecialtiesService],
})
export class SpecialtiesModule { }
