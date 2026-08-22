import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddTeamMemberDto, CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { TeamsService } from './teams.service';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @ApiOperation({ summary: 'Get all teams' })
  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @ApiOperation({ summary: 'Get team by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @ApiOperation({ summary: 'Get team members' })
  @Get(':id/members')
  findMembers(@Param('id') id: string) {
    return this.teamsService.findMembers(id);
  }

  @ApiOperation({ summary: 'Create new team' })
  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @ApiOperation({ summary: 'Update team' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Toggle join status for a team' })
  @Post(':id/join')
  toggleJoin(@Param('id') id: string) {
    return this.teamsService.toggleJoin(id);
  }

  @ApiOperation({ summary: 'Add member to team' })
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddTeamMemberDto) {
    return this.teamsService.addMember(id, dto);
  }

  @ApiOperation({ summary: 'Remove member from team' })
  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.teamsService.removeMember(id, memberId);
  }

  @ApiOperation({ summary: 'Delete team' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.teamsService.delete(id);
  }
}
