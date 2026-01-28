import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SupabaseGuard } from '../supabase';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums';
import { BecomeHostDto } from './dto/become-host.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========== ADMIN ROUTES ==========

  @Get('users')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'List of users with pagination' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(page || 1, limit || 20, role);
  }

  @Patch('users/:id/status')
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Enable/Disable user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'active', required: true, type: Boolean })
  @ApiResponse({ status: 200, description: 'User status updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('active') active: boolean,
  ) {
    return this.usersService.updateStatus(
      id,
      active === true || active === ('true' as any),
    );
  }

  // ========== GUEST ROUTES (PUBLIC HOST LIST) ==========

  @Get('hosts')
  @ApiOperation({ summary: 'List all active hosts' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'specialty', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of hosts with pagination' })
  async findHosts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('specialty') specialty?: string,
  ) {
    return this.usersService.findHosts(page || 1, limit || 20, specialty);
  }

  @Get('hosts/:id')
  @ApiOperation({ summary: 'Get host detail with availability' })
  @ApiParam({ name: 'id', description: 'Host ID' })
  @ApiResponse({
    status: 200,
    description: 'Host detail with availability rules',
  })
  @ApiResponse({ status: 404, description: 'Host not found' })
  async findHostById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findHostById(id);
  }

  // ========== AUTHENTICATED USER ROUTES ==========

  @Patch('users/:id')
  @UseGuards(SupabaseGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Post('users/become-host')
  @UseGuards(SupabaseGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upgrade current user from GUEST to HOST' })
  @ApiResponse({ status: 200, description: 'User upgraded to HOST' })
  @ApiResponse({ status: 400, description: 'User is already a HOST or ADMIN' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async becomeHost(@CurrentUser() user: any, @Body() dto: BecomeHostDto) {
    return this.usersService.becomeHost(user.sub, dto);
  }
}
