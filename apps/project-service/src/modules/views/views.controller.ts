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
  @Get()
  findAll(
    @Query('teamId') teamId?: string,
    @Query('type') type?: 'issue' | 'project',
  ) {
    return this.viewsService.findAll(teamId, type);
  }

  @ApiOperation({ summary: 'Get saved view by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.viewsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create saved view' })
  @Post()
  create(@Body() dto: CreateViewDto) {
    return this.viewsService.create(dto);
  }

  @ApiOperation({ summary: 'Update saved view' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateViewDto) {
    return this.viewsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete saved view' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.viewsService.delete(id);
  }
}
