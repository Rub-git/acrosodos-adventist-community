import { Controller, Post, Body, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned URL for secure file upload to S3' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file size or duration' })
  async getUploadUrl(@Body() uploadUrlDto: UploadUrlDto) {
    return this.mediaService.getUploadUrl(uploadUrlDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
    },
    fileFilter: (req, file, cb) => {
      console.log('[MediaController] File upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
      
      const filename = file.originalname.toLowerCase();
      
      // Reject AVI format (not supported in browsers)
      if (file.mimetype.includes('x-msvideo') || filename.endsWith('.avi')) {
        console.log('[MediaController] Rejecting AVI format');
        cb(new BadRequestException('AVI format is not supported. Please use MP4 or MOV format.'), false);
        return;
      }
      
      // Check by MIME type first
      const allowedTypes = /video|audio|image/;
      const mimetypeValid = allowedTypes.test(file.mimetype);
      
      // Check by file extension as fallback (for when MIME type is application/octet-stream)
      const allowedExtensions = /\.(mp4|mov|m4a|mp3|wav|aac|ogg|opus|jpg|jpeg|png|gif|webp)$/i;
      const extensionValid = allowedExtensions.test(filename);
      
      console.log('[MediaController] Validation:', {
        mimetype: file.mimetype,
        mimetypeValid,
        extensionValid,
        filename: filename.substring(filename.length - 20),
      });
      
      if (mimetypeValid || extensionValid) {
        console.log('[MediaController] File accepted');
        cb(null, true);
      } else {
        console.log('[MediaController] File rejected - invalid type/extension');
        cb(new BadRequestException(`Unsupported file format. Received: ${file.mimetype}, filename: ${file.originalname}`), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload media file directly to server' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        mediaType: {
          type: 'string',
          enum: ['video', 'audio', 'image'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or size limit exceeded' })
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('mediaType') mediaType: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.mediaService.handleDirectUpload(file, mediaType);
  }
}
