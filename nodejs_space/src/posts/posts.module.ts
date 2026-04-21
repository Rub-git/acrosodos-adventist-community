import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModerationModule } from '../ai-moderation/ai-moderation.module';
import { SabbathModule } from '../sabbath/sabbath.module';

@Module({
  imports: [PrismaModule, AiModerationModule, SabbathModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
