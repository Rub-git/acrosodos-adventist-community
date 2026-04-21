import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiModerationService } from '../ai-moderation/ai-moderation.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { HideCommentDto } from './dto/hide-comment.dto';
import { ModerationStatus, UserRole } from '@prisma/client';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private prisma: PrismaService,
    private aiModeration: AiModerationService,
  ) {}

  async createComment(postId: string, userId: string, createCommentDto: CreateCommentDto) {
    try {
      // Check if post exists
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Moderate comment with AI
      const moderationResult = await this.aiModeration.moderateContent(
        createCommentDto.content,
        'comment',
      );

      let moderationStatus: ModerationStatus = 'PENDING';
      if (moderationResult.approved) {
        moderationStatus = 'APPROVED';
      } else if (moderationResult.severity === 'HIGH') {
        moderationStatus = 'FLAGGED';
      }

      const comment = await this.prisma.comment.create({
        data: {
          postid: postId,
          userid: userId,
          content: createCommentDto.content,
          aimoderationstatus: moderationStatus,
          aimoderationnotes: moderationResult.reason,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilepictureurl: true,
            },
          },
        },
      });

      this.logger.log(`Comment created on post ${postId}`);
      return comment;
    } catch (error) {
      this.logger.error(`Failed to create comment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getComments(postId: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const comments = await this.prisma.comment.findMany({
        where: {
          postid: postId,
          ishidden: false,
          aimoderationstatus: { in: ['APPROVED', 'PENDING'] },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilepictureurl: true,
            },
          },
        },
        orderBy: { createdat: 'asc' },
      });

      return comments;
    } catch (error) {
      this.logger.error(`Failed to get comments: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteComment(commentId: string, userId: string, userRole: UserRole) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only comment owner or moderators/admins can delete
    if (comment.userid !== userId && !['MODERATOR', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    this.logger.log(`Comment deleted: ${commentId}`);
    return { message: 'Comment deleted successfully' };
  }

  async hideComment(commentId: string, hideCommentDto: HideCommentDto, moderatorId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        ishidden: true,
        hiddenreason: hideCommentDto.reason,
        hiddenby: moderatorId,
        hiddenat: new Date(),
      },
    });

    this.logger.log(`Comment hidden: ${commentId}`);
    return updated;
  }
}
