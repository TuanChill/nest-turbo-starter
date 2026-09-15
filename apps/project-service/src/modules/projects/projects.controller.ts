import { User } from '@app/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateMilestoneDto,
  CreateProjectDto,
  CreateProjectUpdateDto,
  ReplaceProjectMembersDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Get all projects' })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'health', required: false })
  @ApiQuery({ name: 'workspaceId', required: false })
  @Get()
  findAll(
    @User('id') memberId: string,
    @Query('teamId') teamId?: string,
    @Query('health') health?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.projectsService.findAll(memberId, { teamId, health, workspaceId });
  }

  @ApiOperation({ summary: 'Get project by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') memberId: string) {
    return this.projectsService.findOne(id, memberId);
  }

  @ApiOperation({
    summary: 'Get the authenticated member subscription state for a project',
  })
  @Get(':id/subscription')
  getSubscription(@Param('id') id: string, @User('id') memberId: string) {
    return this.projectsService.getSubscription(id, memberId);
  }

  @ApiOperation({ summary: 'Subscribe the authenticated member to a project' })
  @Post(':id/subscription')
  subscribe(@Param('id') id: string, @User('id') memberId: string) {
    return this.projectsService.subscribe(id, memberId);
  }

  @ApiOperation({ summary: 'Unsubscribe the authenticated member from a project' })
  @Delete(':id/subscription')
  unsubscribe(@Param('id') id: string, @User('id') memberId: string) {
    return this.projectsService.unsubscribe(id, memberId);
  }

  @ApiOperation({
    summary: 'Get project detail (summary, milestones, updates, activity)',
  })
  @Get(':id/detail')
  findDetail(@Param('id') id: string, @User('id') memberId: string) {
    return this.projectsService.findDetail(id, memberId);
  }

  @ApiOperation({ summary: 'Get project members' })
  @Get(':id/members')
  getMembers(@Param('id') id: string, @User('id') memberId: string) {
    return this.projectsService.getMembers(id, memberId);
  }

  @ApiOperation({ summary: 'Replace project members' })
  @Put(':id/members')
  replaceMembers(
    @Param('id') id: string,
    @Body() dto: ReplaceProjectMembersDto,
    @User('id') memberId: string,
  ) {
    return this.projectsService.replaceMembers(id, dto.memberIds, memberId);
  }

  @ApiOperation({ summary: 'Create project' })
  @Post()
  create(@Body() dto: CreateProjectDto, @User('id') memberId: string) {
    return this.projectsService.create(dto, memberId);
  }

  @ApiOperation({ summary: 'Update project' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @User('id') memberId: string,
  ) {
    return this.projectsService.update(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Delete project' })
  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.projectsService.delete(id, memberId);
  }

  @ApiOperation({ summary: 'Post a health update for project' })
  @Post(':id/updates')
  addUpdate(
    @Param('id') id: string,
    @Body() dto: CreateProjectUpdateDto,
    @User('id') memberId: string,
  ) {
    return this.projectsService.addUpdate(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Add milestone to project' })
  @Post(':id/milestones')
  addMilestone(
    @Param('id') id: string,
    @Body() dto: CreateMilestoneDto,
    @User('id') memberId: string,
  ) {
    return this.projectsService.addMilestone(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Toggle milestone completion status' })
  @Patch(':id/milestones/:milestoneId/toggle')
  toggleMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @User('id') memberId: string,
  ) {
    return this.projectsService.toggleMilestone(id, milestoneId, memberId);
  }
}
