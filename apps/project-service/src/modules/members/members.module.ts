import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { SesMailerService } from '../email/ses-mailer.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService, SesMailerService],
  exports: [MembersService, SesMailerService],
})
export class MembersModule {}
