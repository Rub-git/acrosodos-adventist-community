import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { HideCommentDto } from './dto/hide-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { user as User } from '@prisma/client';
import { UserRole } from '@prisma/client';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(postId, user.id, createCommentDto);
  }

  @Public()
  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'Get all comments for a post' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async getComments(@Param('postId') postId: string) {
    return this.commentsService.getComments(postId);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment (or any comment if moderator/admin)' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteComment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentsService.deleteComment(id, user.id, user.role);
  }

  @Post('comments/:id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a comment (moderator only)' })
  @ApiResponse({ status: 200, description: 'Comment hidden successfully' })
  async hideComment(
    @Param('id') id: string,
    @Body() hideCommentDto: HideCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.hideComment(id, hideCommentDto, user.id);
  }
}
