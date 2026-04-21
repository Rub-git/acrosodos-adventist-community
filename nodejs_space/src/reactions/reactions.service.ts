import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(private prisma: PrismaService) {}

  async toggleReaction(postId: string, userId: string, toggleReactionDto: ToggleReactionDto) {
    try {
      // Check if post exists
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if reaction already exists
      const existingReaction = await this.prisma.reaction.findUnique({
        where: {
          postid_userid: {
            postid: postId,
            userid: userId,
          },
        },
      });

      if (existingReaction) {
        // If same reaction type, remove it (toggle off)
        if (existingReaction.reactiontype === toggleReactionDto.reactionType) {
          await this.prisma.reaction.delete({
            where: { id: existingReaction.id },
          });
          this.logger.log(`Reaction removed from post ${postId}`);
          return { message: 'Reaction removed', action: 'removed' };
        } else {
          // Update to new reaction type
          const updated = await this.prisma.reaction.update({
            where: { id: existingReaction.id },
            data: { reactiontype: toggleReactionDto.reactionType },
          });
          this.logger.log(`Reaction updated on post ${postId}`);
          return { message: 'Reaction updated', action: 'updated', reaction: updated };
        }
      } else {
        // Create new reaction
        const reaction = await this.prisma.reaction.create({
          data: {
            postid: postId,
            userid: userId,
            reactiontype: toggleReactionDto.reactionType,
          },
        });
        this.logger.log(`Reaction added to post ${postId}`);
        return { message: 'Reaction added', action: 'added', reaction };
      }
    } catch (error) {
      this.logger.error(`Failed to toggle reaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReactions(postId: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const reactions = await this.prisma.reaction.findMany({
        where: { postid: postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilepictureurl: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
      });

      // Group by reaction type
      const grouped = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.reactiontype]) {
          acc[reaction.reactiontype] = [];
        }
        acc[reaction.reactiontype].push({
          id: reaction.id,
          user: reaction.user,
          createdAt: reaction.createdat,
        });
        return acc;
      }, {} as Record<string, any[]>);

      return {
        total: reactions.length,
        byType: grouped,
        reactions,
      };
    } catch (error) {
      this.logger.error(`Failed to get reactions: ${error.message}`, error.stack);
      throw error;
    }
  }
}
