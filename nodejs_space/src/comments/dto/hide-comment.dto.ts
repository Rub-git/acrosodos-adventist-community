import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HideCommentDto {
  @ApiProperty()
  @IsString()
  reason: string;
}
