import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { UploadUrlDto } from './dto/upload-url.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'adventist-community-media';
  }

  async getUploadUrl(uploadUrlDto: UploadUrlDto): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    try {
      this.validateMediaLimits(uploadUrlDto);

      const fileExtension = this.getFileExtension(uploadUrlDto.contentType);
      const key = `${uploadUrlDto.mediaType}s/${randomUUID()}${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: uploadUrlDto.contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;

      this.logger.log(`Generated presigned URL for ${uploadUrlDto.mediaType}`);

      return {
        uploadUrl,
        fileUrl,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to generate upload URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const key = `${folder}/${randomUUID()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      this.logger.log(`File uploaded to S3: ${key}`);

      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new BadRequestException('File upload failed');
    }
  }

  async handleDirectUpload(file: Express.Multer.File, mediaType: string): Promise<{ fileUrl: string; filename: string; size: number; mimetype: string }> {
    try {
      // Validate file size based on media type
      this.validateDirectUpload(file, mediaType);

      // File is already saved by multer diskStorage
      // Generate the URL to access it
      const baseUrl = this.configService.get<string>('APP_ORIGIN') || 'http://localhost:3000/';
      const fileUrl = `${baseUrl}uploads/${file.filename}`;

      this.logger.log(`File uploaded: ${file.filename} (${mediaType})`);

      return {
        fileUrl,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Failed to handle direct upload: ${error.message}`, error.stack);
      throw error;
    }
  }

  private validateDirectUpload(file: Express.Multer.File, mediaType: string) {
    // Video: max 50MB
    if (mediaType === 'video') {
      if (file.size > 50 * 1024 * 1024) {
        throw new BadRequestException('Video file size exceeds 50MB limit');
      }
    }

    // Audio: max 20MB
    if (mediaType === 'audio') {
      if (file.size > 20 * 1024 * 1024) {
        throw new BadRequestException('Audio file size exceeds 20MB limit');
      }
    }

    // Image: max 5MB
    if (mediaType === 'image') {
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Image file size exceeds 5MB limit');
      }
    }
  }

  private validateMediaLimits(uploadUrlDto: UploadUrlDto) {
    const { mediaType, fileSize, duration } = uploadUrlDto;

    // Video: max 90s / 50MB
    if (mediaType === 'video') {
      if (fileSize > 50 * 1024 * 1024) {
        throw new BadRequestException('Video file size exceeds 50MB limit');
      }
      if (duration && duration > 90) {
        throw new BadRequestException('Video duration exceeds 90 seconds limit');
      }
    }

    // Audio: max 90s / 20MB
    if (mediaType === 'audio') {
      if (fileSize > 20 * 1024 * 1024) {
        throw new BadRequestException('Audio file size exceeds 20MB limit');
      }
      if (duration && duration > 90) {
        throw new BadRequestException('Audio duration exceeds 90 seconds limit');
      }
    }

    // Image: max 5MB
    if (mediaType === 'image') {
      if (fileSize > 5 * 1024 * 1024) {
        throw new BadRequestException('Image file size exceeds 5MB limit');
      }
    }
  }

  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/mp4': '.m4a',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    return extensions[contentType] || '';
  }
}
