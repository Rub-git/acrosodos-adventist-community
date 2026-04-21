import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { ReportContentDto } from './dto/report-content.dto';
import { ReviewFlagDto } from './dto/review-flag.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { user as User } from '@prisma/client';
import { UserRole } from '@prisma/client';

@ApiTags('Moderation')
@Controller()
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Post('posts/:id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a post for review' })
  @ApiResponse({ status: 201, description: 'Post reported successfully' })
  async reportPost(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() reportDto: ReportContentDto,
  ) {
    return this.moderationService.reportPost(id, user.id, reportDto);
  }

  @Post('comments/:id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a comment for review' })
  @ApiResponse({ status: 201, description: 'Comment reported successfully' })
  async reportComment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() reportDto: ReportContentDto,
  ) {
    return this.moderationService.reportComment(id, user.id, reportDto);
  }

  @Get('moderation/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get moderation queue (moderator/admin only)' })
  @ApiResponse({ status: 200, description: 'Moderation queue loaded' })
  async getModerationQueue(@Query() moderationQuery: ModerationQueryDto) {
    return this.moderationService.getModerationQueue(moderationQuery);
  }

  @Post('moderation/flags/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review a flag (moderator/admin only)' })
  @ApiResponse({ status: 200, description: 'Flag reviewed successfully' })
  async reviewFlag(
    @Param('id') id: string,
    @Body() reviewDto: ReviewFlagDto,
    @CurrentUser() user: User,
  ) {
    return this.moderationService.reviewFlag(id, reviewDto, user.id);
  }
}
