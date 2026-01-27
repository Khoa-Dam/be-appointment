import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AvailabilityRulesService } from './availability-rules.service';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { User } from '../users/entities/user.entity';
import { SupabaseGuard } from '../supabase';
import { RolesGuard } from '../common/guards';
import { UserRole } from '../common/enums';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { AvailabilityRule } from './entities/availability-rule.entity';

@ApiTags('availability-rules')
@Controller('availability-rules')
export class AvailabilityRulesController {
    constructor(private readonly availabilityRulesService: AvailabilityRulesService) { }

    @Post()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new availability rule', description: 'Define working hours/days. If user is Guest, they will be auto-upgraded to Host.' })
    @ApiResponse({ status: 201, description: 'Rule created successfully.', type: AvailabilityRule })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    @ApiBody({ type: CreateAvailabilityRuleDto })
    async create(
        @CurrentUser() currentUser: User,
        @Body() createRuleDto: CreateAvailabilityRuleDto
    ) {
        return this.availabilityRulesService.create(currentUser.id, createRuleDto);
    }

    @Get(':hostId')
    @ApiOperation({ summary: 'Get availability rules of a host', description: 'Retrieve all configured rules for a specific host.' })
    @ApiResponse({ status: 200, description: 'List of availability rules.', type: [AvailabilityRule] })
    @ApiParam({ name: 'hostId', description: 'The UUID of the host' })
    async findByHostId(@Param('hostId', ParseUUIDPipe) hostId: string) {
        return this.availabilityRulesService.findByHostId(hostId);
    }

    @Patch(':id')
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.HOST)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an availability rule', description: 'Update details of an existing rule.' })
    @ApiResponse({ status: 200, description: 'Rule updated successfully.', type: AvailabilityRule })
    @ApiResponse({ status: 403, description: 'Forbidden. Only Hosts allowed.' })
    @ApiParam({ name: 'id', description: 'The UUID of the rule' })
    @ApiBody({ type: UpdateAvailabilityRuleDto })
    async update(
        @Param('id', ParseUUIDPipe) ruleId: string,
        @CurrentUser() currentUser: User,
        @Body() updateDto: UpdateAvailabilityRuleDto
    ) {
        return this.availabilityRulesService.update(ruleId, currentUser.id, updateDto);
    }
    @Delete(':id')
    @UseGuards(SupabaseGuard, RolesGuard)
    @Roles(UserRole.HOST)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an availability rule', description: 'Remove an existing rule permanently.' })
    @ApiResponse({ status: 200, description: 'Rule deleted successfully.' })
    @ApiResponse({ status: 403, description: 'Forbidden. Only Hosts allowed.' })
    @ApiParam({ name: 'id', description: 'The UUID of the rule' })
    async delete(
        @Param('id', ParseUUIDPipe) ruleId: string,
        @CurrentUser() currentUser: User
    ) {
        return this.availabilityRulesService.delete(ruleId, currentUser.id);
    }
}
