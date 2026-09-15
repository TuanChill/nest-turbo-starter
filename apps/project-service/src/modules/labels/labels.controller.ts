import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateLabelDto, UpdateLabelDto } from './dto/label.dto';
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
