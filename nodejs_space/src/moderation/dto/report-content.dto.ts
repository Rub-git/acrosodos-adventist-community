import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportContentDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
