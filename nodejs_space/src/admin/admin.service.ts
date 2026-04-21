import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getUsers(page = 1, limit = 20, searchDto?: SearchUsersDto) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};
      
      if (searchDto?.search) {
        where.OR = [
          { email: { contains: searchDto.search, mode: 'insensitive' } },
          { name: { contains: searchDto.search, mode: 'insensitive' } },
        ];
      }
      
      if (searchDto?.role) {
        where.role = searchDto.role;
      }
      
      if (searchDto?.isActive !== undefined) {
        where.isactive = searchDto.isActive;
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdat: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isactive: true,
            suspensionreason: true,
            suspendedat: true,
            localchurch: true,
            ministry: true,
            country: true,
            preferredlanguage: true,
            hasacceptedvalues: true,
            createdat: true,
            lastloginat: true,
            _count: {
              select: {
                posts: true,
                comments: true,
                flagsreported: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      this.logger.log(`Users list loaded: ${users.length} users`);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to load users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async changeUserRole(userId: string, changeRoleDto: ChangeRoleDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { role: changeRoleDto.role },
      });

      this.logger.log(`User role changed: ${userId} -> ${changeRoleDto.role}`);

      const { password, ...sanitized } = updatedUser;
      return sanitized;
    } catch (error) {
      this.logger.error(`Failed to change user role: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getInsights() {
    try {
      const [
        userCount,
        postCount,
        flagCount,
        recentUsers,
        recentPosts,
        activeUsers,
        suspendedUsers,
        commentCount,
        reactionCount,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.post.count(),
        this.prisma.flag.count({ where: { status: 'PENDING' } }),
        this.prisma.user.count({
          where: {
            createdat: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
        this.prisma.post.count({
          where: {
            createdat: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
        this.prisma.user.count({ where: { isactive: true } }),
        this.prisma.user.count({ where: { isactive: false } }),
        this.prisma.comment.count(),
        this.prisma.reaction.count(),
      ]);

      this.logger.log('Admin insights loaded');

      return {
        totalUsers: userCount,
        activeUsers,
        suspendedUsers,
        totalPosts: postCount,
        totalComments: commentCount,
        totalReactions: reactionCount,
        pendingFlags: flagCount,
        newUsersLastWeek: recentUsers,
        newPostsLastWeek: recentPosts,
      };
    } catch (error) {
      this.logger.error(`Failed to load insights: ${error.message}`, error.stack);
      throw error;
    }
  }

  async suspendUser(userId: string, suspendDto: SuspendUserDto, adminId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isactive) {
        throw new BadRequestException('User is already suspended');
      }

      // Don't allow suspending yourself
      if (userId === adminId) {
        throw new BadRequestException('You cannot suspend yourself');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isactive: false,
          suspensionreason: suspendDto.reason,
          suspendedat: new Date(),
          suspendedby: adminId,
        },
      });

      this.logger.log(`User ${userId} suspended by admin ${adminId}: ${suspendDto.reason}`);

      const { password, ...sanitized } = updatedUser;
      return sanitized;
    } catch (error) {
      this.logger.error(`Failed to suspend user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async reactivateUser(userId: string, adminId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isactive) {
        throw new BadRequestException('User is not suspended');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isactive: true,
          suspensionreason: null,
          suspendedat: null,
          suspendedby: null,
        },
      });

      this.logger.log(`User ${userId} reactivated by admin ${adminId}`);

      const { password, ...sanitized } = updatedUser;
      return sanitized;
    } catch (error) {
      this.logger.error(`Failed to reactivate user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserDetails(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isactive: true,
          suspensionreason: true,
          suspendedat: true,
          localchurch: true,
          ministry: true,
          country: true,
          preferredlanguage: true,
          timezone: true,
          hasacceptedvalues: true,
          createdat: true,
          lastloginat: true,
          profilepictureurl: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              reactions: true,
              flagsreported: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get recent posts
      const recentPosts = await this.prisma.post.findMany({
        where: { userid: userId },
        take: 5,
        orderBy: { createdat: 'desc' },
        select: {
          id: true,
          contenttype: true,
          textcontent: true,
          createdat: true,
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
      });

      this.logger.log(`User details loaded for ${userId}`);

      return {
        ...user,
        recentPosts,
      };
    } catch (error) {
      this.logger.error(`Failed to load user details: ${error.message}`, error.stack);
      throw error;
    }
  }

  async resetUserPassword(userId: string, adminId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate temporary password (8 characters, alphanumeric)
      const tempPassword = this.generateTemporaryPassword();
      
      // Hash the temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Update user password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      this.logger.log(`Password reset for user ${userId} by admin ${adminId}`);

      return {
        message: 'Password reset successfully',
        email: user.email,
        temporaryPassword: tempPassword,
      };
    } catch (error) {
      this.logger.error(`Failed to reset password: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
