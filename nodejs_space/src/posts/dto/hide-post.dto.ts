import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HidePostDto {
  @ApiProperty()
  @IsString()
  reason: string;
}
