import { Module } from '@nestjs/common';
import { InitiativesController } from './initiatives.controller';
import { InitiativesService } from './initiatives.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [InitiativesController],
  providers: [InitiativesService],
  exports: [InitiativesService],
})
export class InitiativesModule {}
