import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { Member, TeamMember, WorkspaceMember } from '../../data-access';
import { SesMailerService } from '../email/ses-mailer.service';

@Injectable()
export class MembersService {
  constructor(
    private readonly em: EntityManager,
    private readonly sesMailerService: SesMailerService,
  ) {}

  async findAll(memberId?: string, workspaceId?: string): Promise<any[]> {
    let members: Member[];
    if (workspaceId) {
      const workspaceMembers = await this.em.find(WorkspaceMember, { workspaceId });
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
    const teamMembers = await this.em.find(TeamMember, {});

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

  async findOne(id: string): Promise<any> {
    const member = await this.em.findOne(Member, { id });
    if (!member) throw new NotFoundException(`Member ${id} not found`);

    const teamMembers = await this.em.find(TeamMember, { memberId: id });
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
      status: member.status,
      role: member.role,
      timezone: member.timezone,
      teamIds: teamMembers.map((tm) => tm.teamId),
      joinedDate: member.joinedDate
        ? member.joinedDate.toISOString().split('T')[0]
        : null,
    };
  }

  async create(dto: CreateMemberDto): Promise<any> {
    let id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.em.findOne(Member, { id });
    if (existing) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    const { teamIds, workspaceId, ...memberData } = dto;
    const member = new Member({
      ...memberData,
      id,
      joinedDate: new Date(),
    });
    this.em.persist(member);

    if (workspaceId) {
      const workspaceMember = new WorkspaceMember({
        id: uuidv4(),
        workspaceId,
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
      this.sesMailerService
        .sendMemberInviteEmail({
          to: member.email,
          name: member.name,
          role: member.role,
        })
        .catch((err) => console.error('Failed to send invite email:', err));
    }

    return this.findOne(member.id);
  }

  async update(id: string, dto: UpdateMemberDto): Promise<any> {
    const member = await this.em.findOne(Member, { id });
    if (!member) throw new NotFoundException(`Member ${id} not found`);

    if (dto.name) member.name = dto.name;
    if (dto.avatarUrl !== undefined) member.avatarUrl = dto.avatarUrl;
    if (dto.status) member.status = dto.status;
    if (dto.role) member.role = dto.role;
    if (dto.timezone) member.timezone = dto.timezone;

    await this.em.flush();
    return this.findOne(member.id);
  }

  async getMemberTeams(id: string): Promise<any[]> {
    const teamMembers = await this.em.find(TeamMember, { memberId: id });
    return teamMembers.map((tm) => tm.teamId);
  }
}
