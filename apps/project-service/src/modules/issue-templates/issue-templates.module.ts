import { Module } from '@nestjs/common';
import { IssueTemplatesController } from './issue-templates.controller';
import { IssueTemplatesService } from './issue-templates.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [IssueTemplatesController],
  providers: [IssueTemplatesService],
})
export class IssueTemplatesModule {}
