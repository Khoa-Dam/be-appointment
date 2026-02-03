import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SupabaseGuard } from '../supabase';
import { CurrentUser } from '../common/decorators';

@ApiTags('patients')
@Controller('patients')
@UseGuards(SupabaseGuard)
@ApiBearerAuth('access-token')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new patient profile (max 5 per user)' })
    @ApiResponse({ status: 201, description: 'Patient created' })
    @ApiResponse({ status: 400, description: 'Max 5 patients reached' })
    async create(@CurrentUser() user: any, @Body() dto: CreatePatientDto) {
        return this.patientsService.create(user.sub, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get my patient profiles' })
    @ApiResponse({ status: 200, description: 'List of patient profiles' })
    async findMyPatients(@CurrentUser() user: any) {
        return this.patientsService.findMyPatients(user.sub);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get patient detail' })
    @ApiResponse({ status: 200, description: 'Patient detail' })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    async findOne(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.patientsService.findOne(id, user.sub);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update patient profile' })
    @ApiResponse({ status: 200, description: 'Patient updated' })
    async update(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePatientDto,
    ) {
        return this.patientsService.update(id, user.sub, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete patient profile' })
    @ApiResponse({ status: 200, description: 'Patient deleted' })
    async delete(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.patientsService.delete(id, user.sub);
    }
}
