import { Public } from '@app/common';
import { Controller, NotFoundException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Seed database with full initial Circle dataset' })
  @Public()
  @Post()
  seed() {
    const nodeEnv = this.configService.get<string>('appCommon.nodeEnv');
    if (nodeEnv !== 'local' && nodeEnv !== 'development') {
      throw new NotFoundException();
    }

    return this.seedService.seedAll();
  }
}
