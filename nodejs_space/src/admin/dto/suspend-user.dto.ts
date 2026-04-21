import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({ description: 'Reason for suspension', example: 'Violated community guidelines' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
