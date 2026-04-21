import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FlagStatus } from '@prisma/client';

export class ReviewFlagDto {
  @ApiProperty({ enum: FlagStatus })
  @IsEnum(FlagStatus)
  status: FlagStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}
