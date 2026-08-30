import { User } from '@app/common';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @ApiOperation({ summary: 'Get all workspaces for authenticated user' })
  @Get()
  findAll(@User('id') memberId: string): Promise<any[]> {
    return this.workspacesService.findAll(memberId);
  }

  @ApiOperation({ summary: 'Get workspace details by ID or Slug' })
  @Get(':idOrSlug')
  findOne(
    @Param('idOrSlug') idOrSlug: string,
    @User('id') memberId: string,
  ): Promise<any> {
    return this.workspacesService.findOne(idOrSlug, memberId);
  }

  @ApiOperation({ summary: 'Create a new workspace' })
  @Post()
  create(@Body() dto: CreateWorkspaceDto, @User('id') memberId: string): Promise<any> {
    return this.workspacesService.create(dto, memberId);
  }

  @ApiOperation({ summary: 'Join an existing workspace by invite code or slug' })
  @Post('join')
  join(@Body() dto: JoinWorkspaceDto, @User('id') memberId: string): Promise<any> {
    return this.workspacesService.join(dto, memberId);
  }

  @ApiOperation({ summary: 'Regenerate invite code for workspace' })
  @Post(':id/invite-code')
  regenerateInviteCode(
    @Param('id') id: string,
    @User('id') memberId: string,
  ): Promise<{ inviteCode: string }> {
    return this.workspacesService
      .regenerateInviteCode(id, memberId)
      .then((inviteCode) => ({ inviteCode }));
  }
}
