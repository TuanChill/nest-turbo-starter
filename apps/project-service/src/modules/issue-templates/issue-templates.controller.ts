import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateIssueTemplateDto, UpdateIssueTemplateDto } from './dto/issue-template.dto';
import { IssueTemplatesService } from './issue-templates.service';

@ApiTags('Issue templates')
@Controller('issue-templates')
export class IssueTemplatesController {
  constructor(private readonly service: IssueTemplatesService) {}

  @ApiOperation({ summary: 'List issue templates visible to the current member' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @Get()
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
  create(@Body() dto: CreateIssueTemplateDto, @User('id') memberId: string) {
    return this.service.create(dto, memberId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIssueTemplateDto,
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
