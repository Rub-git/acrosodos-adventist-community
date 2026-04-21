import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReactionsService } from './reactions.service';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { user as User } from '@prisma/client';

@ApiTags('Reactions')
@Controller('posts/:postId/reactions')
export class ReactionsController {
  constructor(private reactionsService: ReactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle reaction on a post (add/update/remove)' })
  @ApiResponse({ status: 200, description: 'Reaction toggled successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async toggleReaction(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
    @Body() toggleReactionDto: ToggleReactionDto,
  ) {
    return this.reactionsService.toggleReaction(postId, user.id, toggleReactionDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all reactions for a post with user info' })
  @ApiResponse({ status: 200, description: 'Reactions retrieved successfully' })
  async getReactions(@Param('postId') postId: string) {
    return this.reactionsService.getReactions(postId);
  }
}
