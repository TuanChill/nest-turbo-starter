import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateLabelDto,
  CreateLabelGroupDto,
  UpdateLabelDto,
  UpdateLabelGroupDto,
} from './dto/label.dto';
import { LabelsService } from './labels.service';

@ApiTags('Labels')
@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @ApiOperation({ summary: 'Get all labels' })
  @Get()
  findAll(@User('id') memberId: string, @Query('scope') scope?: 'issue' | 'project') {
    return this.labelsService.findAll(memberId, scope);
  }

  @ApiOperation({ summary: 'Get all label groups' })
  @Get('groups')
  findAllGroups(
    @User('id') memberId: string,
    @Query('scope') scope?: 'issue' | 'project',
  ) {
    return this.labelsService.findAllGroups(memberId, scope);
  }

  @ApiOperation({ summary: 'Create label group' })
  @Post('groups')
  createGroup(@Body() dto: CreateLabelGroupDto, @User('id') memberId: string) {
    return this.labelsService.createGroup(dto, memberId);
  }

  @ApiOperation({ summary: 'Update label group' })
  @Patch('groups/:id')
  updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateLabelGroupDto,
    @User('id') memberId: string,
  ) {
    return this.labelsService.updateGroup(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Delete label group' })
  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string, @User('id') memberId: string) {
    return this.labelsService.deleteGroup(id, memberId);
  }

  @ApiOperation({ summary: 'Get label by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') memberId: string) {
    return this.labelsService.findOne(id, memberId);
  }

  @ApiOperation({ summary: 'Create label' })
  @Post()
  create(@Body() dto: CreateLabelDto, @User('id') memberId: string) {
    return this.labelsService.create(dto, memberId);
  }

  @ApiOperation({ summary: 'Update label' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLabelDto,
    @User('id') memberId: string,
  ) {
    return this.labelsService.update(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Delete label' })
  @Delete(':id')
  delete(@Param('id') id: string, @User('id') memberId: string) {
    return this.labelsService.delete(id, memberId);
  }
}
