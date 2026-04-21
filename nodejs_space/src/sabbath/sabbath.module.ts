import { Module } from '@nestjs/common';
import { SabbathController } from './sabbath.controller';
import { SabbathService } from './sabbath.service';

@Module({
  controllers: [SabbathController],
  providers: [SabbathService],
  exports: [SabbathService],
})
export class SabbathModule {}
