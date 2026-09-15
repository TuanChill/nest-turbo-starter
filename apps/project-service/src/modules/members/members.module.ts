import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { SesMailerService } from '../email/ses-mailer.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [MembersController],
  providers: [MembersService, SesMailerService],
  exports: [MembersService, SesMailerService],
})
export class MembersModule {}
