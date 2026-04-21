import { IsString, IsEnum, IsOptional, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentType, PostCategory, Language } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ enum: PostCategory })
  @IsEnum(PostCategory)
  category: PostCategory;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  textContent?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ required: false, description: 'Duration in seconds' })
  @IsNumber()
  @IsOptional()
  mediaDuration?: number;

  @ApiProperty({ required: false, description: 'File size in bytes' })
  @IsNumber()
  @IsOptional()
  mediaSize?: number;

  @ApiProperty({ enum: Language, required: false })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;
}
