import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModerationService } from './ai-moderation.service';

@Module({
  imports: [ConfigModule],
  providers: [AiModerationService],
  exports: [AiModerationService],
})
export class AiModerationModule {}
