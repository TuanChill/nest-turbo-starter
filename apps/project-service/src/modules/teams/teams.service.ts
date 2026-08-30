import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AddTeamMemberDto, CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { Member, Project, Team, TeamMember, WorkspaceMember } from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

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
    if (!accessibleTeamIds.includes(teamId)) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  async findAll(memberId?: string, workspaceId?: string) {
    let filter: any = {};
    if (workspaceId) {
      filter = { workspaceId };
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

    const membersMap = new Map(members.map((m) => [m.id, m]));

    return teams.map((team) => {
      const teamUserIds = teamMembers
        .filter((tm) => tm.teamId === team.id)
        .map((tm) => tm.memberId);
      const teamUsers = teamUserIds.map((id) => membersMap.get(id)).filter(Boolean);
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
      members,
      projects,
    };
  }

  async create(dto: CreateTeamDto, currentMemberId: string) {
    let id = (dto.id || dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '')).slice(0, 10);
    if (!id) id = `TEAM${Date.now().toString().slice(-3)}`;
    const existing = await this.em.findOne(Team, { id });
    if (existing) {
      id = `${id.slice(0, 7)}${Date.now().toString().slice(-3)}`;
    }
    const { memberIds, ...teamData } = dto;
    const team = new Team({
      ...teamData,
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
    return this.findOne(teamId);
  }

  async removeMember(teamId: string, memberId: string, actorId: string) {
    await this.assertTeamAccess(actorId, teamId, `Team ${teamId} not found`);
    const tm = await this.em.findOne(TeamMember, { teamId, memberId });
    if (tm) {
      this.em.remove(tm);
      await this.em.flush();
    }
    return this.findOne(teamId);
  }

  async findMembers(teamId: string) {
    const teamMembers = await this.em.find(TeamMember, { teamId });
    const memberIds = teamMembers.map((tm) => tm.memberId);
    return this.em.find(Member, { id: { $in: memberIds } });
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
