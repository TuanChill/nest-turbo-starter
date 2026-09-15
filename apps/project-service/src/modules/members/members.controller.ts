import { User } from '@app/common';
import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MembersService } from './members.service';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @ApiOperation({ summary: 'Get all workspace members' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @Get()
  findAll(
    @User('id') memberId: string,
    @Req() req: Request,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<any[]> {
    const headerWsId = req.headers['x-workspace-id'] as string;
    return this.membersService.findAll(memberId, workspaceId || headerWsId);
  }

  @ApiOperation({ summary: 'Get workspace member by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') requesterId: string): Promise<any> {
    return this.membersService.findOne(id, requesterId);
  }

  @ApiOperation({ summary: 'Create new member' })
  @Post()
  create(@Body() dto: CreateMemberDto, @User('id') actorId: string): Promise<any> {
    return this.membersService.create(dto, actorId);
  }

  @ApiOperation({ summary: 'Update member' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @User('id') actorId: string,
  ): Promise<any> {
    return this.membersService.update(id, dto, actorId);
  }

  @ApiOperation({ summary: 'Get teams of a member' })
  @Get(':id/teams')
  getTeams(@Param('id') id: string, @User('id') requesterId: string): Promise<any[]> {
    return this.membersService.getMemberTeams(id, requesterId);
  }
}
