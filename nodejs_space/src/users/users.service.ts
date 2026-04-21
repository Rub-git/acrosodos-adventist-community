import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: updateProfileDto.name,
          localchurch: updateProfileDto.localChurch,
          ministry: updateProfileDto.ministry,
          country: updateProfileDto.country,
          preferredlanguage: updateProfileDto.preferredLanguage,
          timezone: updateProfileDto.timezone,
        },
      });

      this.logger.log(`Profile updated for user: ${user.email}`);
      const { password, ...sanitized } = updatedUser;
      return sanitized;
    } catch (error) {
      this.logger.error(`Profile update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateProfilePicture(userId: string, profilePictureUrl: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilepictureurl: profilePictureUrl,
        },
      });

      this.logger.log(`Profile picture updated for user: ${user.email}`);
      const { password, ...sanitized } = updatedUser;
      return sanitized;
    } catch (error) {
      this.logger.error(`Profile picture update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...sanitized } = user;
    return sanitized;
  }
}
