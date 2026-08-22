import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Member, Project, Team, TeamMember } from '../../data-access';
import { AddTeamMemberDto, CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly em: EntityManager) {}

  async findAll() {
    const teams = await this.em.find(Team, {});
    const teamMembers = await this.em.find(TeamMember, {});
    const members = await this.em.find(Member, {});
    const projects = await this.em.find(Project, {});

    const membersMap = new Map(members.map((m) => [m.id, m]));

    return teams.map((team) => {
      const teamUserIds = teamMembers
        .filter((tm) => tm.teamId === team.id)
        .map((tm) => tm.memberId);
      const teamUsers = teamUserIds
        .map((id) => membersMap.get(id))
        .filter(Boolean);
      const teamProjects = projects.filter((p) => p.teamId === team.id);

      return {
        id: team.id,
        name: team.name,
        icon: team.icon,
        color: team.color,
        joined: team.joined,
        description: team.description,
        members: teamUsers,
        projects: teamProjects,
      };
    });
  }

  async findOne(id: string) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    const teamMembers = await this.em.find(TeamMember, { teamId: id });
    const members = await this.em.find(Member, {
      id: { $in: teamMembers.map((tm) => tm.memberId) },
    });
    const projects = await this.em.find(Project, { teamId: id });

    return {
      id: team.id,
      name: team.name,
      icon: team.icon,
      color: team.color,
      joined: team.joined,
      description: team.description,
      members,
      projects,
    };
  }

  async create(dto: CreateTeamDto) {
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
    if (team.joined) {
      membersToEnroll.add('ln'); // Default active user
    }

    for (const memberId of membersToEnroll) {
      const tm = new TeamMember({
        teamId: team.id,
        memberId,
        role: 'member',
        joinedAt: new Date(),
      });
      this.em.persist(tm);
    }

    await this.em.flush();
    return this.findOne(team.id);
  }

  async update(id: string, dto: UpdateTeamDto) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    Object.assign(team, dto);
    await this.em.flush();
    return this.findOne(id);
  }

  async toggleJoin(id: string) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    team.joined = !team.joined;
    await this.em.flush();
    return this.findOne(id);
  }

  async addMember(teamId: string, dto: AddTeamMemberDto) {
    const team = await this.em.findOne(Team, { id: teamId });
    if (!team) throw new NotFoundException(`Team ${teamId} not found`);

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

  async removeMember(teamId: string, memberId: string) {
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

  async delete(id: string) {
    const team = await this.em.findOne(Team, { id });
    if (!team) throw new NotFoundException(`Team ${id} not found`);

    const teamMembers = await this.em.find(TeamMember, { teamId: id });
    for (const tm of teamMembers) {
      this.em.remove(tm);
    }
    this.em.remove(team);
    await this.em.flush();
    return { success: true, id };
  }
}
