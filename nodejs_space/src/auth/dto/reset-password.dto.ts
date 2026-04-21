import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit reset code' })
  @IsString()
  @IsNotEmpty()
  resetCode: string;

  @ApiProperty({ example: 'NewPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;
}
