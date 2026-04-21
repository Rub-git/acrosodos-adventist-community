import { Controller, Put, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { user as User } from '@prisma/client';
import { MediaService } from '../media/media.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private mediaService: MediaService,
  ) {}

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max for profile pictures
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed'), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile picture (max 5MB)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile picture successfully uploaded' })
  async uploadProfilePicture(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('[uploadProfilePicture] Request received');
    console.log('[uploadProfilePicture] User:', user?.id, user?.email);
    console.log('[uploadProfilePicture] File:', file ? {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    } : 'NO FILE');

    if (!file) {
      console.error('[uploadProfilePicture] No file uploaded');
      throw new BadRequestException('No file uploaded');
    }

    // File validation is already done by fileFilter and limits in FileInterceptor
    // File is already saved by diskStorage in ./uploads/ directory
    // Generate the URL to access it
    const baseUrl = process.env.APP_ORIGIN || 'http://localhost:3000/';
    const fileUrl = `${baseUrl}uploads/${file.filename}`;
    
    console.log('[uploadProfilePicture] File saved locally, URL:', fileUrl);
    
    console.log('[uploadProfilePicture] Updating user profile picture...');
    const result = await this.usersService.updateProfilePicture(user.id, fileUrl);
    console.log('[uploadProfilePicture] Profile picture updated successfully');
    
    return result;
  }
}
