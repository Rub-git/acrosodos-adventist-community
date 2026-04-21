import { Controller, Get, Put, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { user as User } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by email or name' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Users list loaded' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
  ) {
    const searchDto: SearchUsersDto = { search, role, isActive };
    return this.adminService.getUsers(page, limit, searchDto);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Change user role (admin only)' })
  @ApiResponse({ status: 200, description: 'User role changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.adminService.changeUserRole(id, changeRoleDto);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get platform insights and statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Insights loaded successfully' })
  async getInsights() {
    return this.adminService.getInsights();
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user (admin only)' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(
    @Param('id') id: string,
    @Body() suspendDto: SuspendUserDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.suspendUser(id, suspendDto, admin.id);
  }

  @Post('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended user (admin only)' })
  @ApiResponse({ status: 200, description: 'User reactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async reactivateUser(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.reactivateUser(id, admin.id);
  }

  @Get('users/:id/details')
  @ApiOperation({ summary: 'Get detailed user information (admin only)' })
  @ApiResponse({ status: 200, description: 'User details loaded' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password (admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully. Returns temporary password.' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetUserPassword(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.resetUserPassword(id, admin.id);
  }
}
