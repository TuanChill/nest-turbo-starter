import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateMilestoneDto,
  CreateProjectDto,
  CreateProjectUpdateDto,
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
  @Get()
  findAll(@Query('teamId') teamId?: string, @Query('health') health?: string) {
    return this.projectsService.findAll({ teamId, health });
  }

  @ApiOperation({ summary: 'Get project by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @ApiOperation({ summary: 'Get project detail (summary, milestones, updates, activity)' })
  @Get(':id/detail')
  findDetail(@Param('id') id: string) {
    return this.projectsService.findDetail(id);
  }

  @ApiOperation({ summary: 'Create project' })
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @ApiOperation({ summary: 'Update project' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete project' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  @ApiOperation({ summary: 'Post a health update for project' })
  @Post(':id/updates')
  addUpdate(@Param('id') id: string, @Body() dto: CreateProjectUpdateDto) {
    return this.projectsService.addUpdate(id, dto);
  }

  @ApiOperation({ summary: 'Add milestone to project' })
  @Post(':id/milestones')
  addMilestone(@Param('id') id: string, @Body() dto: CreateMilestoneDto) {
    return this.projectsService.addMilestone(id, dto);
  }

  @ApiOperation({ summary: 'Toggle milestone completion status' })
  @Patch(':id/milestones/:milestoneId/toggle')
  toggleMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.projectsService.toggleMilestone(id, milestoneId);
  }
}
