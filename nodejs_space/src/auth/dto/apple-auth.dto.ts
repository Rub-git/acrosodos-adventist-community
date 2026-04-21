import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppleAuthDto {
  @ApiProperty({ description: 'Apple identity token' })
  @IsString()
  identityToken: string;
}
