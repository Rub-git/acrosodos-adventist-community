import { IsString, IsOptional, IsEnum, IsTimeZone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  localChurch?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ministry?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ enum: Language, required: false })
  @IsEnum(Language)
  @IsOptional()
  preferredLanguage?: Language;

  @ApiProperty({ required: false })
  @IsTimeZone()
  @IsOptional()
  timezone?: string;
}
