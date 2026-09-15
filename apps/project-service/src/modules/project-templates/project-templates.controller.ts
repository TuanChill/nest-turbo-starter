import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateProjectTemplateDto,
  InstantiateProjectTemplateDto,
  UpdateProjectTemplateDto,
} from './dto/project-template.dto';
import { ProjectTemplatesService } from './project-templates.service';

@ApiTags('Project templates')
@Controller('project-templates')
export class ProjectTemplatesController {
  constructor(private readonly service: ProjectTemplatesService) {}

  @Get()
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  findAll(
    @User('id') memberId: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.service.findAll(memberId, workspaceId, teamId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('id') memberId: string) {
    return this.service.findOne(id, memberId);
  }

  @Post()
  create(@Body() dto: CreateProjectTemplateDto, @User('id') memberId: string) {
    return this.service.create(dto, memberId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectTemplateDto,
    @User('id') memberId: string,
  ) {
    return this.service.update(id, dto, memberId);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @User('id') memberId: string) {
    return this.service.duplicate(id, memberId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.service.delete(id, memberId);
  }
}

@ApiTags('Projects')
@Controller('projects')
export class ProjectInstantiationController {
  constructor(private readonly service: ProjectTemplatesService) {}

  @Post('from-template/:templateId')
  @ApiOperation({ summary: 'Create a project from a template' })
  instantiate(
    @Param('templateId') templateId: string,
    @Body() dto: InstantiateProjectTemplateDto,
    @User('id') memberId: string,
  ) {
    return this.service.instantiate(templateId, dto, memberId);
  }
}
