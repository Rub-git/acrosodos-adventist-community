import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';

export class ToggleReactionDto {
  @ApiProperty({ enum: ReactionType })
  @IsEnum(ReactionType)
  reactionType: ReactionType;
}
