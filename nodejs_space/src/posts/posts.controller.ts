import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { HidePostDto } from './dto/hide-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { user as User } from '@prisma/client';
import { UserRole } from '@prisma/client';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post with text or media' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid post data' })
  async createPost(@CurrentUser() user: User, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(user.id, createPostDto);
  }

  @Public()
  @Get('feed')
  @ApiOperation({ summary: 'Get paginated feed with Sabbath Mode awareness' })
  @ApiResponse({ status: 200, description: 'Feed loaded successfully' })
  async getFeed(@Query() feedQuery: FeedQueryDto) {
    return this.postsService.getFeed(feedQuery);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiResponse({ status: 200, description: 'Post found' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPost(@Param('id') id: string) {
    return this.postsService.getPost(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own post (or any post if moderator/admin)' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.deletePost(id, user.id, user.role);
  }

  @Post(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a post (moderator only)' })
  @ApiResponse({ status: 200, description: 'Post hidden successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async hidePost(
    @Param('id') id: string,
    @Body() hidePostDto: HidePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.hidePost(id, hidePostDto, user.id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a hidden post (moderator only)' })
  @ApiResponse({ status: 200, description: 'Post restored successfully' })
  async restorePost(@Param('id') id: string) {
    return this.postsService.restorePost(id);
  }
}
