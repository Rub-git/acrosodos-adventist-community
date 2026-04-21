import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiModerationService } from '../ai-moderation/ai-moderation.service';
import { SabbathService } from '../sabbath/sabbath.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { HidePostDto } from './dto/hide-post.dto';
import { ModerationStatus, UserRole } from '@prisma/client';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private aiModeration: AiModerationService,
    private sabbathService: SabbathService,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    try {
      // Validate content exists
      if (!createPostDto.textContent && !createPostDto.mediaUrl) {
        throw new BadRequestException('Post must contain either text or media content');
      }

      // Moderate content with AI
      let moderationStatus: ModerationStatus = 'PENDING';
      let moderationNotes = '';

      if (createPostDto.textContent) {
        const moderationResult = await this.aiModeration.moderateContent(
          createPostDto.textContent,
          'post',
        );

        if (moderationResult.approved) {
          moderationStatus = 'APPROVED';
        } else if (moderationResult.severity === 'HIGH') {
          moderationStatus = 'FLAGGED';
        } else {
          moderationStatus = 'PENDING';
        }

        moderationNotes = moderationResult.reason;
        this.logger.log(`AI moderation: ${moderationStatus} - ${moderationNotes}`);
      } else {
        // Media-only posts auto-approved (manual review can flag later)
        moderationStatus = 'APPROVED';
      }

      const post = await this.prisma.post.create({
        data: {
          userid: userId,
          contenttype: createPostDto.contentType,
          category: createPostDto.category,
          textcontent: createPostDto.textContent,
          mediaurl: createPostDto.mediaUrl,
          thumbnailurl: createPostDto.thumbnailUrl,
          mediaduration: createPostDto.mediaDuration,
          mediasize: createPostDto.mediaSize,
          language: createPostDto.language || 'en',
          aimoderationstatus: moderationStatus,
          aimoderationnotes: moderationNotes,
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

      this.logger.log(`Post created: ${post.id} by user ${userId}`);
      return post;
    } catch (error) {
      this.logger.error(`Failed to create post: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFeed(feedQuery: FeedQueryDto, userId?: string) {
    try {
      const { page = 1, limit = 20, category, language, timezone } = feedQuery;
      const skip = (page - 1) * limit;

      // Check Sabbath mode
      const sabbathStatus = this.sabbathService.getSabbathStatus(
        timezone || 'America/New_York',
      );

      const where: any = {
        ishidden: false,
        aimoderationstatus: { in: ['APPROVED', 'PENDING'] },
      };

      if (category) {
        where.category = category;
      }

      if (language) {
        where.language = language;
      }

      // During Sabbath, prioritize Sabbath-related content
      const orderBy: any = sabbathStatus.isSabbath
        ? [
            { category: 'desc' }, // SABBATH_ACTIVITY posts first
            { createdat: 'desc' },
          ]
        : [{ createdat: 'desc' }];

      const [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilepictureurl: true,
              },
            },
            _count: {
              select: {
                reactions: true,
                comments: true,
              },
            },
          },
        }),
        this.prisma.post.count({ where }),
      ]);

      this.logger.log(`Feed loaded: ${posts.length} posts (Sabbath mode: ${sabbathStatus.isSabbath})`);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        sabbathMode: sabbathStatus,
      };
    } catch (error) {
      this.logger.error(`Failed to load feed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilepictureurl: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async deletePost(postId: string, userId: string, userRole: UserRole) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only post owner or moderators/admins can delete
    if (post.userid !== userId && !['MODERATOR', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    this.logger.log(`Post deleted: ${postId}`);
    return { message: 'Post deleted successfully' };
  }

  async hidePost(postId: string, hidePostDto: HidePostDto, moderatorId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ishidden: true,
        hiddenreason: hidePostDto.reason,
        hiddenby: moderatorId,
        hiddenat: new Date(),
      },
    });

    this.logger.log(`Post hidden: ${postId} by moderator ${moderatorId}`);
    return updatedPost;
  }

  async restorePost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ishidden: false,
        hiddenreason: null,
        hiddenby: null,
        hiddenat: null,
      },
    });

    this.logger.log(`Post restored: ${postId}`);
    return updatedPost;
  }
}
