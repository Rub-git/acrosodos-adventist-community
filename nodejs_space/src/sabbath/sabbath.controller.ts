import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SabbathService } from './sabbath.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Sabbath')
@Controller('sabbath')
export class SabbathController {
  constructor(private sabbathService: SabbathService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Get current Sabbath status for a timezone' })
  @ApiQuery({ name: 'timezone', required: false, example: 'America/New_York' })
  @ApiResponse({ status: 200, description: 'Sabbath status returned' })
  getSabbathStatus(@Query('timezone') timezone?: string) {
    return this.sabbathService.getSabbathStatus(timezone || 'America/New_York');
  }
}
