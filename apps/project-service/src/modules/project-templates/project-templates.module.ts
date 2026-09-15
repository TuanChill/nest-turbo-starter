import { Module } from '@nestjs/common';
import {
  ProjectInstantiationController,
  ProjectTemplatesController,
} from './project-templates.controller';
import { ProjectTemplatesService } from './project-templates.service';
import { IssuesModule } from '../issues/issues.module';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule, ProjectsModule, IssuesModule],
  controllers: [ProjectTemplatesController, ProjectInstantiationController],
  providers: [ProjectTemplatesService],
})
export class ProjectTemplatesModule {}
