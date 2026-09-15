import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateViewDto, UpdateViewDto } from './dto/view.dto';
import { ViewsService } from './views.service';

@ApiTags('Views')
@Controller('views')
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @ApiOperation({ summary: 'Get all saved views' })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['issue', 'project'] })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'workspaceId', required: false })
  @Get()
  findAll(
    @User('id') memberId: string,
    @Query('teamId') teamId?: string,
    @Query('type') type?: 'issue' | 'project',
    @Query('projectId') projectId?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.viewsService.findAll(memberId, teamId, type, projectId, workspaceId);
  }

  @ApiOperation({ summary: 'Get saved view by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') memberId: string) {
    return this.viewsService.findOne(id, memberId);
  }

  @ApiOperation({ summary: 'Create saved view' })
  @Post()
  create(@Body() dto: CreateViewDto, @User('id') ownerId: string) {
    return this.viewsService.create(dto, ownerId);
  }

  @ApiOperation({ summary: 'Update saved view' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateViewDto,
    @User('id') memberId: string,
  ) {
    return this.viewsService.update(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Delete saved view' })
  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.viewsService.delete(id, memberId);
  }
}
