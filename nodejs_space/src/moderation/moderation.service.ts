import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportContentDto } from './dto/report-content.dto';
import { ReviewFlagDto } from './dto/review-flag.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private prisma: PrismaService) {}

  async reportPost(postId: string, userId: string, reportDto: ReportContentDto) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const flag = await this.prisma.flag.create({
        data: {
          postid: postId,
          reportedby: userId,
          reason: reportDto.reason,
          description: reportDto.description,
        },
      });

      this.logger.log(`Post ${postId} reported by user ${userId}`);
      return flag;
    } catch (error) {
      this.logger.error(`Failed to report post: ${error.message}`, error.stack);
      throw error;
    }
  }

  async reportComment(commentId: string, userId: string, reportDto: ReportContentDto) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      const flag = await this.prisma.flag.create({
        data: {
          commentid: commentId,
          reportedby: userId,
          reason: reportDto.reason,
          description: reportDto.description,
        },
      });

      this.logger.log(`Comment ${commentId} reported by user ${userId}`);
      return flag;
    } catch (error) {
      this.logger.error(`Failed to report comment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getModerationQueue(moderationQuery: ModerationQueryDto) {
    try {
      const { page = 1, limit = 20, status } = moderationQuery;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [flags, total] = await Promise.all([
        this.prisma.flag.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdat: 'desc' },
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            comment: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.flag.count({ where }),
      ]);

      this.logger.log(`Moderation queue loaded: ${flags.length} flags`);

      return {
        flags,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to load moderation queue: ${error.message}`, error.stack);
      throw error;
    }
  }

  async reviewFlag(flagId: string, reviewDto: ReviewFlagDto, reviewerId: string) {
    try {
      const flag = await this.prisma.flag.findUnique({
        where: { id: flagId },
        include: { post: true, comment: true },
      });

      if (!flag) {
        throw new NotFoundException('Flag not found');
      }

      // If status is REVIEWED, hide the content
      if (reviewDto.status === 'REVIEWED') {
        if (flag.postid) {
          await this.prisma.post.update({
            where: { id: flag.postid },
            data: { ishidden: true },
          });
          this.logger.log(`Post ${flag.postid} hidden by moderator ${reviewerId}`);
        } else if (flag.commentid) {
          await this.prisma.comment.update({
            where: { id: flag.commentid },
            data: { ishidden: true },
          });
          this.logger.log(`Comment ${flag.commentid} hidden by moderator ${reviewerId}`);
        }
      }

      const updatedFlag = await this.prisma.flag.update({
        where: { id: flagId },
        data: {
          status: reviewDto.status,
          reviewedby: reviewerId,
          reviewedat: new Date(),
          reviewnotes: reviewDto.reviewNotes,
        },
      });

      this.logger.log(`Flag ${flagId} reviewed by ${reviewerId}: ${reviewDto.status}`);
      return updatedFlag;
    } catch (error) {
      this.logger.error(`Failed to review flag: ${error.message}`, error.stack);
      throw error;
    }
  }
}
