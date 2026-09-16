import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { hashInvitationToken } from './invitation-token';
import {
  Member,
  Team,
  TeamMember,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
} from '../../data-access';
import { canAccessWorkspace, canManageWorkspaceRole } from '../access-control';

@Injectable()
export class WorkspacesService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Teams a member can see: direct memberships and teams in accessible
   * workspaces. Unscoped or orphaned teams are never visible.
   */
  async getAccessibleTeamIds(memberId: string): Promise<string[]> {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    if (workspaceIds.length === 0) return [];

    const [workspaceTeams, directMemberships] = await Promise.all([
      this.em.find(Team, { workspaceId: { $in: workspaceIds } }),
      this.em.find(TeamMember, { memberId }),
    ]);
    const directTeamIds = directMemberships.map((membership) => membership.teamId);
    const directTeams = directTeamIds.length
      ? await this.em.find(Team, { id: { $in: directTeamIds } })
      : [];

    return [
      ...new Set(
        [...workspaceTeams, ...directTeams]
          .filter(
            (team) =>
              Boolean(team.workspaceId) && workspaceIds.includes(team.workspaceId!),
          )
          .map((team) => team.id),
      ),
    ];
  }

  /** Workspaces visible to a member, including workspaces reached through a team membership. */
  async getAccessibleWorkspaceIds(memberId: string): Promise<string[]> {
    const [workspaceMemberships, teamMemberships, ownedWorkspaces] = await Promise.all([
      this.em.find(WorkspaceMember, { memberId }),
      this.em.find(TeamMember, { memberId }),
      this.em.find(Workspace, { ownerId: memberId }),
    ]);

    const workspaceIds = new Set([
      ...workspaceMemberships.map((membership) => membership.workspaceId),
      ...ownedWorkspaces.map((workspace) => workspace.id),
    ]);
    const teamIds = teamMemberships.map((membership) => membership.teamId);
    if (teamIds.length > 0) {
      const teams = await this.em.find(Team, { id: { $in: teamIds } });
      for (const team of teams) {
        if (team.workspaceId) workspaceIds.add(team.workspaceId);
      }
    }

    if (workspaceIds.size === 0) return [];
    const workspaces = await this.em.find(Workspace, { id: { $in: [...workspaceIds] } });
    return workspaces.map((workspace) => workspace.id);
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CIR-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async findAll(memberId?: string, memberEmail?: string): Promise<any[]> {
    let member: Member | null = null;
    if (memberId || memberEmail) {
      member = await this.em.findOne(Member, {
        $or: [
          ...(memberId ? [{ id: memberId }, { email: memberId }] : []),
          ...(memberEmail ? [{ email: memberEmail }, { id: memberEmail }] : []),
        ],
      });
    }
    const resolvedMemberId = member ? member.id : memberId;

    const workspaces = await this.em.find(Workspace, {});

    const rows = await Promise.all(
      workspaces.map(async (ws) => {
        const members = await this.em.find(WorkspaceMember, { workspaceId: ws.id });
        const currentMemberMembership = resolvedMemberId
          ? members.find(
              (m) =>
                m.memberId === resolvedMemberId || (member && m.memberId === member.id),
            )
          : null;

        const isOwner = resolvedMemberId
          ? ws.ownerId === resolvedMemberId || (member && ws.ownerId === member.id)
          : false;

        // Include workspace ONLY if memberId is a member/owner, or if listing all without memberId filter
        if (!resolvedMemberId || currentMemberMembership || isOwner) {
          const canManage =
            isOwner || canManageWorkspaceRole(currentMemberMembership?.role);
          return {
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            icon: ws.icon,
            description: ws.description,
            ownerId: ws.ownerId,
            ...(canManage ? { inviteCode: ws.inviteCode } : {}),
            memberCount: Math.max(members.length, 1),
            role: currentMemberMembership
              ? currentMemberMembership.role
              : isOwner
                ? 'Owner'
                : 'Member',
            joinedAt: currentMemberMembership
              ? currentMemberMembership.joinedAt
              : ws.createdAt,
            createdAt: ws.createdAt,
            updatedAt: ws.updatedAt,
          };
        }
        return null;
      }),
    );

    return rows.filter((row): row is NonNullable<typeof row> => row !== null);
  }

  async findOne(idOrSlug: string, memberId?: string, memberEmail?: string): Promise<any> {
    const ws = await this.em.findOne(Workspace, {
      $or: [{ id: idOrSlug }, { slug: idOrSlug }],
    });

    if (!ws) {
      throw new NotFoundException(`Workspace "${idOrSlug}" not found`);
    }

    let member: Member | null = null;
    if (memberId || memberEmail) {
      member = await this.em.findOne(Member, {
        $or: [
          ...(memberId ? [{ id: memberId }, { email: memberId }] : []),
          ...(memberEmail ? [{ email: memberEmail }, { id: memberEmail }] : []),
        ],
      });
    }
    const resolvedMemberId = member ? member.id : memberId;

    const members = await this.em.find(WorkspaceMember, { workspaceId: ws.id });
    const currentMemberMembership = resolvedMemberId
      ? members.find(
          (m) => m.memberId === resolvedMemberId || (member && m.memberId === member.id),
        )
      : null;
    const isOwner = resolvedMemberId
      ? ws.ownerId === resolvedMemberId || (member && ws.ownerId === member.id)
      : false;

    if (
      (memberId || memberEmail) &&
      !canAccessWorkspace(
        currentMemberMembership ? [ws.id] : [],
        ws.id,
        isOwner ? resolvedMemberId : null,
        resolvedMemberId || '',
      )
    ) {
      throw new NotFoundException(`Workspace "${idOrSlug}" not found`);
    }

    const canManage = isOwner || canManageWorkspaceRole(currentMemberMembership?.role);
    const { inviteCode, ...workspaceData } = ws;
    return {
      ...workspaceData,
      memberCount: members.length,
      role: currentMemberMembership
        ? currentMemberMembership.role
        : isOwner
          ? 'Owner'
          : 'Member',
      ...(canManage ? { inviteCode } : {}),
    };
  }

  async create(dto: CreateWorkspaceDto, currentMemberId: string): Promise<any> {
    let rawSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    if (!rawSlug) {
      throw new BadRequestException(
        'Workspace name or slug must contain at least one alphanumeric character',
      );
    }

    // Check slug collision
    let finalSlug = rawSlug;
    let counter = 1;
    // oxlint-disable-next-line no-await-in-loop -- each candidate slug depends on the previous one being taken
    while (await this.em.findOne(Workspace, { slug: finalSlug })) {
      finalSlug = `${rawSlug}-${counter}`;
      counter++;
    }

    // Generate invite code
    let inviteCode = this.generateInviteCode();
    // oxlint-disable-next-line no-await-in-loop -- each candidate code depends on the previous one being taken
    while (await this.em.findOne(Workspace, { inviteCode })) {
      inviteCode = this.generateInviteCode();
    }

    const workspaceId = finalSlug;
    const workspace = new Workspace({
      id: workspaceId,
      name: dto.name.trim(),
      slug: finalSlug,
      icon: dto.icon || 'from-orange-600 to-amber-500',
      description: dto.description?.trim(),
      ownerId: currentMemberId,
      inviteCode,
    });

    this.em.persist(workspace);

    const membership = new WorkspaceMember({
      id: uuidv4(),
      workspaceId: workspace.id,
      memberId: currentMemberId,
      role: 'Owner',
      joinedAt: new Date(),
    });

    this.em.persist(membership);
    await this.em.flush();

    const canManage =
      membership.role === 'Owner' || canManageWorkspaceRole(membership.role);
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      icon: workspace.icon,
      description: workspace.description,
      ownerId: workspace.ownerId,
      ...(canManage ? { inviteCode: workspace.inviteCode } : {}),
      role: 'Owner',
      memberCount: 1,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async join(dto: JoinWorkspaceDto, currentMemberId: string): Promise<any> {
    const invitationToken = dto.invitationToken?.trim();
    let invitation: WorkspaceInvitation | null = null;
    let workspace: Workspace | null = null;

    if (invitationToken) {
      const currentMember = await this.em.findOne(Member, { id: currentMemberId });
      if (!currentMember) {
        throw new NotFoundException('Authenticated member not found');
      }
      invitation = await this.em.findOne(WorkspaceInvitation, {
        tokenHash: hashInvitationToken(invitationToken),
        acceptedAt: null,
      });
      if (!invitation || invitation.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('This invitation is invalid or has expired');
      }
      if (currentMember.email.trim().toLowerCase() !== invitation.email) {
        throw new BadRequestException(
          'This invitation was issued for a different email address',
        );
      }
      workspace = await this.em.findOne(Workspace, { id: invitation.workspaceId });
      if (!workspace) {
        throw new NotFoundException('The invited workspace no longer exists');
      }
    }

    const inviteCode = dto.inviteCode?.trim().toUpperCase();

    if (!invitation && !inviteCode) {
      throw new BadRequestException(
        'Please provide an invitation token or workspace invite code',
      );
    }

    if (!workspace) {
      workspace = await this.em.findOne(Workspace, { inviteCode });
    }

    if (!workspace) {
      throw new NotFoundException(
        'Workspace not found. Please check your invitation or invite code.',
      );
    }

    // Check if already a member
    let membership = await this.em.findOne(WorkspaceMember, {
      workspaceId: workspace.id,
      memberId: currentMemberId,
    });

    if (!membership) {
      membership = new WorkspaceMember({
        id: uuidv4(),
        workspaceId: workspace.id,
        memberId: currentMemberId,
        role:
          workspace.ownerId === currentMemberId ? 'Owner' : invitation?.role || 'Member',
        joinedAt: new Date(),
      });
      this.em.persist(membership);
    }

    if (invitation) {
      const invitedTeamIds = [...new Set(invitation.teamIds ?? [])];
      const teams = invitedTeamIds.length
        ? await this.em.find(Team, { id: { $in: invitedTeamIds } })
        : [];
      const existingTeamMemberships = invitedTeamIds.length
        ? await this.em.find(TeamMember, {
            teamId: { $in: invitedTeamIds },
            memberId: currentMemberId,
          })
        : [];
      const existingTeamIds = new Set(
        existingTeamMemberships.map((teamMembership) => teamMembership.teamId),
      );
      for (const team of teams) {
        if (team.workspaceId !== workspace.id) continue;
        if (!existingTeamIds.has(team.id)) {
          this.em.persist(
            new TeamMember({
              teamId: team.id,
              memberId: currentMemberId,
              role: 'member',
              joinedAt: new Date(),
            }),
          );
        }
      }
      invitation.acceptedAt = new Date();
    }

    await this.em.flush();

    const members = await this.em.find(WorkspaceMember, { workspaceId: workspace.id });
    const canManage =
      workspace.ownerId === currentMemberId || canManageWorkspaceRole(membership.role);

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      icon: workspace.icon,
      description: workspace.description,
      ownerId: workspace.ownerId,
      ...(canManage ? { inviteCode: workspace.inviteCode } : {}),
      role: membership.role,
      memberCount: members.length,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async regenerateInviteCode(
    workspaceId: string,
    currentMemberId: string,
  ): Promise<string> {
    const workspace = await this.em.findOne(Workspace, {
      $or: [{ id: workspaceId }, { slug: workspaceId }],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.em.findOne(WorkspaceMember, {
      workspaceId: workspace.id,
      memberId: currentMemberId,
    });
    if (
      workspace.ownerId !== currentMemberId &&
      !canManageWorkspaceRole(membership?.role)
    ) {
      throw new NotFoundException('Workspace not found');
    }

    const newCode = this.generateInviteCode();
    workspace.inviteCode = newCode;
    await this.em.flush();

    return newCode;
  }
}
