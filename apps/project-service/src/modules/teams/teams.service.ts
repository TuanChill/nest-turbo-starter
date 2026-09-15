import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AddTeamMemberDto, CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import {
  Member,
  Project,
  Team,
  TeamMember,
  toSafeMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import { allMembersBelongToWorkspace, canAccessTeam } from '../access-control';
import { WorkspacesService } from '../workspaces/workspaces.service';

export interface PublicMember {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'away';
  role: 'Member' | 'Admin' | 'Guest' | 'Application';
  timezone: string;
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async assertTeamAccess(
    memberId: string,
    teamId: string,
    notFoundMessage: string,
  ) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!canAccessTeam(accessibleTeamIds, teamId)) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private async resolveWorkspaceId(memberId: string, requestedWorkspaceId: string) {
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    const workspace = await this.em.findOne(Workspace, {
      $or: [{ id: requestedWorkspaceId }, { slug: requestedWorkspaceId }],
    });
    return workspace && accessibleWorkspaceIds.includes(workspace.id)
      ? workspace.id
      : null;
  }

  private toPublicMember(member: Member): PublicMember {
    return {
      id: member.id,
      email: member.email,
      name: member.name,
      avatarUrl: member.avatarUrl,
      status: member.status,
      role: member.role,
      timezone: member.timezone,
      joinedDate: member.joinedDate,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      deletedAt: member.deletedAt,
    };
  }

  async findAll(memberId?: string, workspaceId?: string) {
    let filter: any = {};
    if (workspaceId) {
      if (memberId) {
        const resolvedWorkspaceId = await this.resolveWorkspaceId(memberId, workspaceId);
        if (!resolvedWorkspaceId) return [];
        filter = { workspaceId: resolvedWorkspaceId };
      } else {
        filter = { workspaceId };
      }
    } else if (memberId) {
      // Find all workspaces where memberId is a member
      const userWorkspaces = await this.em.find(WorkspaceMember, { memberId });
      const userTeamMemberships = await this.em.find(TeamMember, { memberId });
      const wsIds = userWorkspaces.map((w) => w.workspaceId);
      const teamIds = userTeamMemberships.map((t) => t.teamId);

      const conditions: any[] = [];
      if (wsIds.length > 0) {
        conditions.push({ workspaceId: { $in: wsIds } });
      }
      if (teamIds.length > 0) {
        conditions.push({ id: { $in: teamIds } });
      }

      filter = conditions.length > 0 ? { $or: conditions } : {};
    }

    const teams = await this.em.find(Team, filter);
    const teamMembers = await this.em.find(TeamMember, {});
    const members = await this.em.find(Member, {});
    const projects = await this.em.find(Project, {});

    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return teams.map((team) => {
      const teamUserIds = teamMembers
        .filter((tm) => tm.teamId === team.id)
        .map((tm) => tm.memberId);
      const teamUsers = teamUserIds
        .map((id) => membersMap.get(id))
        .filter((m): m is Member => Boolean(m))
        .map((m) => this.toPublicMember(m));
      const teamProjects = projects.filter((p) => p.teamId === team.id);

      const isJoined = memberId ? teamUserIds.includes(memberId) : team.joined;

      return {
        id: team.id,
        name: team.name,
        icon: team.icon,
        color: team.color,
        joined: isJoined,
        workspaceId: team.workspaceId,
        description: team.description,
        members: teamUsers,
        projects: teamProjects,
      };
    });
  }

  async findOne(id: string, memberId?: string) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    if (memberId) {
      await this.assertTeamAccess(memberId, id, `Team ${id} not found`);
    }

    const teamMembers = await this.em.find(TeamMember, { teamId: id });
    const members = await this.em.find(Member, {
      id: { $in: teamMembers.map((tm) => tm.memberId) },
    });
    const projects = await this.em.find(Project, { teamId: id });

    const isJoined = memberId
      ? teamMembers.some((tm) => tm.memberId === memberId)
      : team.joined;

    return {
      id: team.id,
      name: team.name,
      icon: team.icon,
      color: team.color,
      joined: isJoined,
      workspaceId: team.workspaceId,
      description: team.description,
      members: members.map((m) => this.toPublicMember(m)),
      projects,
    };
  }

  async create(dto: CreateTeamDto, currentMemberId: string) {
    let resolvedWorkspaceId: string | undefined;
    if (dto.workspaceId) {
      resolvedWorkspaceId =
        (await this.resolveWorkspaceId(currentMemberId, dto.workspaceId)) || undefined;
      if (!resolvedWorkspaceId) {
        throw new NotFoundException(`Workspace ${dto.workspaceId} not found`);
      }
    }

    let id = (dto.id || dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '')).slice(0, 10);
    if (!id) id = `TEAM${Date.now().toString().slice(-3)}`;
    const existing = await this.em.findOne(Team, { id });
    if (existing) {
      id = `${id.slice(0, 7)}${Date.now().toString().slice(-3)}`;
    }
    const { memberIds, ...teamData } = dto;
    const team = new Team({
      ...teamData,
      ...(resolvedWorkspaceId ? { workspaceId: resolvedWorkspaceId } : {}),
      id,
      icon: dto.icon || '⚡',
      color: dto.color || '#5e6ad2',
      joined: dto.joined !== undefined ? dto.joined : true,
    });
    this.em.persist(team);

    // Add initial team members
    const membersToEnroll = new Set<string>(memberIds || []);
    if (team.joined && currentMemberId) {
      membersToEnroll.add(currentMemberId);
    }

    if (team.workspaceId && membersToEnroll.size > 0) {
      const workspaceMembers = await this.em.find(WorkspaceMember, {
        workspaceId: team.workspaceId,
        memberId: { $in: [...membersToEnroll] },
      });
      const validMemberIds = new Set(
        workspaceMembers.map((membership) => membership.memberId),
      );
      const invalidMemberIds = [...membersToEnroll].filter(
        (memberId) => !validMemberIds.has(memberId),
      );
      if (
        invalidMemberIds.length > 0 ||
        !allMembersBelongToWorkspace([...validMemberIds], [...membersToEnroll])
      ) {
        throw new NotFoundException(`Member(s) ${invalidMemberIds.join(', ')} not found`);
      }
    }

    for (const memberId of membersToEnroll) {
      const tm = new TeamMember({
        teamId: team.id,
        memberId,
        role: memberId === currentMemberId ? 'lead' : 'member',
        joinedAt: new Date(),
      });
      this.em.persist(tm);
    }

    await this.em.flush();
    return this.findOne(team.id, currentMemberId);
  }

  async update(id: string, dto: UpdateTeamDto, currentMemberId: string) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    await this.assertTeamAccess(currentMemberId, id, `Team ${id} not found`);

    Object.assign(team, dto);
    await this.em.flush();
    return this.findOne(id, currentMemberId);
  }

  async toggleJoin(id: string, currentMemberId: string) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    await this.assertTeamAccess(currentMemberId, id, `Team ${id} not found`);

    const existingTm = await this.em.findOne(TeamMember, {
      teamId: id,
      memberId: currentMemberId,
    });

    if (existingTm) {
      this.em.remove(existingTm);
    } else {
      this.em.persist(
        new TeamMember({
          teamId: id,
          memberId: currentMemberId,
          role: 'member',
          joinedAt: new Date(),
        }),
      );
    }

    await this.em.flush();
    return this.findOne(id, currentMemberId);
  }

  async addMember(teamId: string, dto: AddTeamMemberDto, actorId: string) {
    const team = await this.em.findOne(Team, { id: teamId });
    if (!team) throw new NotFoundException(`Team ${teamId} not found`);
    await this.assertTeamAccess(actorId, teamId, `Team ${teamId} not found`);

    if (team.workspaceId) {
      const member = await this.em.findOne(WorkspaceMember, {
        workspaceId: team.workspaceId,
        memberId: dto.memberId,
      });
      if (!member) throw new NotFoundException(`Member ${dto.memberId} not found`);
    }

    const existing = await this.em.findOne(TeamMember, {
      teamId,
      memberId: dto.memberId,
    });
    if (!existing) {
      const tm = new TeamMember({
        teamId,
        memberId: dto.memberId,
        role: dto.role || 'member',
      });
      this.em.persist(tm);
      await this.em.flush();
    }
    return this.findOne(teamId, actorId);
  }

  async removeMember(teamId: string, memberId: string, actorId: string) {
    await this.assertTeamAccess(actorId, teamId, `Team ${teamId} not found`);
    const tm = await this.em.findOne(TeamMember, { teamId, memberId });
    if (tm) {
      this.em.remove(tm);
      await this.em.flush();
    }
    return this.findOne(teamId, actorId);
  }

  async findMembers(teamId: string, memberId: string) {
    await this.assertTeamAccess(memberId, teamId, `Team ${teamId} not found`);
    const teamMembers = await this.em.find(TeamMember, { teamId });
    const memberIds = teamMembers.map((tm) => tm.memberId);
    const members = await this.em.find(Member, { id: { $in: memberIds } });
    return members.map((m) => this.toPublicMember(m));
  }

  async delete(id: string, actorId: string) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    await this.assertTeamAccess(actorId, id, `Team ${id} not found`);

    const teamMembers = await this.em.find(TeamMember, { teamId: id });
    for (const tm of teamMembers) {
      this.em.remove(tm);
    }
    this.em.remove(team);
    await this.em.flush();
    return { success: true, id };
  }
}
