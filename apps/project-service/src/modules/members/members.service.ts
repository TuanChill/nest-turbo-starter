import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4, v7 } from 'uuid';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { filterVisibleTeamIds } from './member-scope';
import { Member, Team, TeamMember, Workspace, WorkspaceMember } from '../../data-access';
import { SesMailerService } from '../email/ses-mailer.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class MembersService {
  constructor(
    private readonly em: EntityManager,
    private readonly sesMailerService: SesMailerService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async resolveWorkspaceId(actorId: string, requestedWorkspaceId: string) {
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(actorId);
    const workspace = await this.em.findOne(Workspace, {
      $or: [{ id: requestedWorkspaceId }, { slug: requestedWorkspaceId }],
    });
    if (!workspace || !accessibleWorkspaceIds.includes(workspace.id)) {
      throw new NotFoundException(`Workspace ${requestedWorkspaceId} not found`);
    }
    return workspace.id;
  }

  private async getVisibleTeamIds(
    requesterId: string,
    workspaceId?: string,
  ): Promise<Set<string>> {
    if (workspaceId) {
      const resolvedWorkspaceId = await this.resolveWorkspaceId(requesterId, workspaceId);
      const teams = await this.em.find(Team, { workspaceId: resolvedWorkspaceId });
      return new Set(teams.map((team) => team.id));
    }

    return new Set(await this.workspacesService.getAccessibleTeamIds(requesterId));
  }

  async findAll(memberId?: string, workspaceId?: string): Promise<any[]> {
    let members: Member[];
    const visibleTeamIds = memberId
      ? await this.getVisibleTeamIds(memberId, workspaceId)
      : new Set<string>();
    if (workspaceId) {
      const resolvedWorkspaceId = await this.resolveWorkspaceId(memberId, workspaceId);
      const workspaceMembers = await this.em.find(WorkspaceMember, {
        workspaceId: resolvedWorkspaceId,
      });
      const memberIds = workspaceMembers.map((wm) => wm.memberId);
      members = await this.em.find(Member, { id: { $in: memberIds } });
    } else if (memberId) {
      // No explicit workspace given: scope to every workspace the requester belongs to.
      const userWorkspaces = await this.em.find(WorkspaceMember, { memberId });
      const wsIds = userWorkspaces.map((wm) => wm.workspaceId);
      const workspaceMembers = await this.em.find(WorkspaceMember, {
        workspaceId: { $in: wsIds },
      });
      const memberIds = [...new Set(workspaceMembers.map((wm) => wm.memberId))];
      members = await this.em.find(Member, { id: { $in: memberIds } });
    } else {
      members = await this.em.find(Member, {});
    }
    const teamMembers = await this.em.find(TeamMember, {
      teamId: { $in: [...visibleTeamIds] },
    });

    return members.map((member) => {
      const teamIds = teamMembers
        .filter((tm) => tm.memberId === member.id)
        .map((tm) => tm.teamId);
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: member.avatarUrl,
        status: member.status,
        role: member.role,
        timezone: member.timezone,
        teamIds,
        joinedDate: member.joinedDate
          ? member.joinedDate.toISOString().split('T')[0]
          : null,
      };
    });
  }

  async findOne(id: string, requesterId: string): Promise<any> {
    const member = await this.em.findOne(Member, { id });
    if (!member) throw new NotFoundException(`Member ${id} not found`);

    const [requesterWorkspaceIds, targetWorkspaceMemberships] = await Promise.all([
      this.workspacesService.getAccessibleWorkspaceIds(requesterId),
      this.em.find(WorkspaceMember, { memberId: id }),
    ]);
    if (
      !targetWorkspaceMemberships.some((membership) =>
        requesterWorkspaceIds.includes(membership.workspaceId),
      )
    ) {
      throw new NotFoundException(`Member ${id} not found`);
    }

    const visibleTeamIds = await this.getVisibleTeamIds(requesterId);
    const teamMembers = await this.em.find(TeamMember, { memberId: id });
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
      status: member.status,
      role: member.role,
      timezone: member.timezone,
      teamIds: filterVisibleTeamIds(teamMembers, visibleTeamIds),
      joinedDate: member.joinedDate
        ? member.joinedDate.toISOString().split('T')[0]
        : null,
    };
  }

  async create(dto: CreateMemberDto, actorId: string): Promise<any> {
    if (!dto.workspaceId) {
      throw new BadRequestException('workspaceId is required when creating a member');
    }
    const resolvedWorkspaceId = await this.resolveWorkspaceId(actorId, dto.workspaceId);
    let id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.em.findOne(Member, { id });
    if (existing) {
      id = `${id}-${v7()}`;
    }
    const { teamIds, ...memberData } = dto;
    if (teamIds && Array.isArray(teamIds) && teamIds.length > 0) {
      const teams = await this.em.find(Team, { id: { $in: [...new Set(teamIds)] } });
      const invalidTeamIds = teamIds.filter(
        (teamId) =>
          !teams.some(
            (team) => team.id === teamId && team.workspaceId === resolvedWorkspaceId,
          ),
      );
      if (invalidTeamIds.length > 0) {
        throw new BadRequestException(
          `Team(s) ${[...new Set(invalidTeamIds)].join(', ')} do not belong to the workspace`,
        );
      }
    }
    const member = new Member({
      ...memberData,
      id,
      joinedDate: new Date(),
    });
    this.em.persist(member);

    if (resolvedWorkspaceId) {
      const workspaceMember = new WorkspaceMember({
        id: uuidv4(),
        workspaceId: resolvedWorkspaceId,
        memberId: member.id,
        role: dto.role === 'Admin' ? 'Admin' : dto.role === 'Guest' ? 'Guest' : 'Member',
        joinedAt: new Date(),
      });
      this.em.persist(workspaceMember);
    }

    if (teamIds && Array.isArray(teamIds)) {
      for (const teamId of teamIds) {
        const teamMember = new TeamMember({
          teamId,
          memberId: member.id,
          role: dto.role || 'Member',
          joinedAt: new Date(),
        });
        this.em.persist(teamMember);
      }
    }

    await this.em.flush();

    // Dispatch invite email in background (non-blocking)
    if (member.email) {
      const workspace = resolvedWorkspaceId
        ? await this.em.findOne(Workspace, {
            id: resolvedWorkspaceId,
          })
        : null;
      const inviter = await this.em.findOne(Member, { id: actorId });
      this.sesMailerService
        .sendMemberInviteEmail({
          to: member.email,
          name: member.name,
          role: member.role,
          orgName: workspace?.name ?? '',
          orgSlug: workspace?.slug ?? '',
          inviterName: inviter?.name ?? '',
        })
        .catch((err) => console.error('Failed to send invite email:', err));
    }

    return this.findOne(member.id, actorId);
  }

  async update(id: string, dto: UpdateMemberDto, actorId: string): Promise<any> {
    const member = await this.em.findOne(Member, { id });
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    await this.findOne(id, actorId);

    if (dto.name) member.name = dto.name;
    if (dto.avatarUrl !== undefined) member.avatarUrl = dto.avatarUrl;
    if (dto.status) member.status = dto.status;
    if (dto.role) member.role = dto.role;
    if (dto.timezone) member.timezone = dto.timezone;

    await this.em.flush();
    return this.findOne(member.id, actorId);
  }

  async getMemberTeams(id: string, requesterId: string): Promise<any[]> {
    await this.findOne(id, requesterId);
    const visibleTeamIds = await this.getVisibleTeamIds(requesterId);
    const teamMembers = await this.em.find(TeamMember, { memberId: id });
    return filterVisibleTeamIds(teamMembers, visibleTeamIds);
  }
}
