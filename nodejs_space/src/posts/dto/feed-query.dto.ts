import { IsOptional, IsNumber, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PostCategory, Language } from '@prisma/client';

export class FeedQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ enum: PostCategory, required: false })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @ApiProperty({ enum: Language, required: false })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}
