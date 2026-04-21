import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsTimeZone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'en', enum: Language, required: false })
  @IsEnum(Language)
  @IsOptional()
  preferredLanguage?: Language;

  @ApiProperty({ example: 'America/New_York', required: false })
  @IsTimeZone()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'Central Church', required: false })
  @IsString()
  @IsOptional()
  localChurch?: string;

  @ApiProperty({ example: 'Youth Ministry', required: false })
  @IsString()
  @IsOptional()
  ministry?: string;

  @ApiProperty({ example: 'USA', required: false })
  @IsString()
  @IsOptional()
  country?: string;
}
