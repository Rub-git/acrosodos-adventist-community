import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModerationModule } from '../ai-moderation/ai-moderation.module';

@Module({
  imports: [PrismaModule, AiModerationModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
