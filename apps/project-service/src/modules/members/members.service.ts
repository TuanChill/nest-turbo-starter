import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Member, TeamMember } from '../../data-access';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { SesMailerService } from '../email/ses-mailer.service';

@Injectable()
export class MembersService {
  constructor(
    private readonly em: EntityManager,
    private readonly sesMailerService: SesMailerService,
  ) {}

  async findAll(): Promise<any[]> {
    const members = await this.em.find(Member, {});
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
        joinedDate: member.joinedDate ? member.joinedDate.toISOString().split('T')[0] : null,
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
      joinedDate: member.joinedDate ? member.joinedDate.toISOString().split('T')[0] : null,
    };
  }

  async create(dto: CreateMemberDto): Promise<any> {
    let id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.em.findOne(Member, { id });
    if (existing) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    const { teamIds, ...memberData } = dto;
    const member = new Member({
      ...memberData,
      id,
      joinedDate: new Date(),
    });
    this.em.persist(member);

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
