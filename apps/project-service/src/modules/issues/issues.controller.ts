import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AddReactionDto,
  AddRelationDto,
  CreateCommentDto,
  CreateIssueDto,
  UpdateIssueDto,
  UpdateIssueRankDto,
} from './dto/issue.dto';
import { IssuesService } from './issues.service';

@ApiTags('Issues')
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @ApiOperation({ summary: 'Get all issues with multi-dimensional filtering' })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'cycleId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'statusCategories', required: false })
  @ApiQuery({ name: 'statusIds', required: false })
  @ApiQuery({ name: 'priorityIds', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'labelIds', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @Get()
  findAll(
    @User('id') memberId: string,
    @Query('teamId') teamId?: string,
    @Query('cycleId') cycleId?: string,
    @Query('projectId') projectId?: string,
    @Query('statusCategories') statusCategories?: string,
    @Query('statusIds') statusIds?: string,
    @Query('priorityIds') priorityIds?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('labelIds') labelIds?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.issuesService.findAll(memberId, {
      teamId,
      cycleId,
      projectId,
      statusCategories,
      statusIds,
      priorityIds,
      assigneeId,
      labelIds,
      search,
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get issue by identifier or ID' })
  @Get(':identifier')
  findOne(@Param('identifier') identifier: string, @User('id') memberId: string) {
    return this.issuesService.findOne(identifier, memberId);
  }

  @ApiOperation({
    summary: 'Get issue detail (description blocks, activity feed, relations, PRs)',
  })
  @Get(':identifier/detail')
  findDetail(@Param('identifier') identifier: string, @User('id') memberId: string) {
    return this.issuesService.findDetail(identifier, memberId);
  }

  @ApiOperation({ summary: 'Create new issue' })
  @Post()
  create(@Body() dto: CreateIssueDto, @User('id') actorId: string) {
    return this.issuesService.create(dto, actorId);
  }

  @ApiOperation({ summary: 'Update issue' })
  @Patch(':identifier')
  update(
    @Param('identifier') identifier: string,
    @Body() dto: UpdateIssueDto,
    @User('id') actorId: string,
  ) {
    return this.issuesService.update(identifier, dto, actorId);
  }

  @ApiOperation({ summary: 'Update issue rank (LexoRank reordering)' })
  @Patch(':identifier/rank')
  updateRank(
    @Param('identifier') identifier: string,
    @Body() dto: UpdateIssueRankDto,
    @User('id') memberId: string,
  ) {
    return this.issuesService.updateRank(identifier, dto.rank, memberId);
  }

  @ApiOperation({ summary: 'Delete issue' })
  @Delete(':identifier')
  delete(@Param('identifier') identifier: string, @User('id') memberId: string) {
    return this.issuesService.delete(identifier, memberId);
  }

  @ApiOperation({ summary: 'Add comment to issue' })
  @Post(':identifier/comments')
  addComment(
    @Param('identifier') identifier: string,
    @Body() dto: CreateCommentDto,
    @User('id') actorId: string,
  ) {
    return this.issuesService.addComment(identifier, dto, actorId);
  }

  @ApiOperation({ summary: 'Add reaction to issue activity/comment' })
  @Post('activities/:activityId/reactions')
  addReaction(@Param('activityId') activityId: string, @Body() dto: AddReactionDto) {
    return this.issuesService.addReaction(activityId, dto);
  }

  @ApiOperation({ summary: 'Add relation between issues (blocks, relates_to, etc.)' })
  @Post(':identifier/relations')
  addRelation(
    @Param('identifier') identifier: string,
    @Body() dto: AddRelationDto,
    @User('id') memberId: string,
  ) {
    return this.issuesService.addRelation(identifier, dto, memberId);
  }
}
