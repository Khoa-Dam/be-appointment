import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';

@ApiTags('specialties')
@Controller('specialties')
export class SpecialtiesController {
    constructor(private readonly specialtiesService: SpecialtiesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all specialties' })
    @ApiResponse({ status: 200, description: 'List of specialties' })
    async findAll() {
        return this.specialtiesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get specialty by ID' })
    @ApiResponse({ status: 200, description: 'Specialty detail' })
    @ApiResponse({ status: 404, description: 'Specialty not found' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.specialtiesService.findOne(id);
    }
}
