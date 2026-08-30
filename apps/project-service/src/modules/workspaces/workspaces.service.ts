import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { Team, TeamMember, Workspace, WorkspaceMember } from '../../data-access';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly em: EntityManager) {}

  /** Teams a member can see: their direct team memberships plus every team in a workspace they belong to. */
  async getAccessibleTeamIds(memberId: string): Promise<string[]> {
    const [workspaceMemberships, teamMemberships] = await Promise.all([
      this.em.find(WorkspaceMember, { memberId }),
      this.em.find(TeamMember, { memberId }),
    ]);

    const workspaceIds = workspaceMemberships.map((wm) => wm.workspaceId);
    const teamIds = new Set(teamMemberships.map((tm) => tm.teamId));

    if (workspaceIds.length > 0) {
      const workspaceTeams = await this.em.find(Team, {
        workspaceId: { $in: workspaceIds },
      });
      for (const team of workspaceTeams) {
        teamIds.add(team.id);
      }
    }

    return Array.from(teamIds);
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

  async ensureDefaultWorkspace(memberId: string): Promise<Workspace | null> {
    const existingCount = await this.em.count(Workspace, {});
    if (existingCount === 0) {
      this.logger.log('Seeding initial default Circle Workspace in database...');
      const workspace = new Workspace({
        id: 'circle-workspace',
        name: 'Circle Workspace',
        slug: 'circle-workspace',
        icon: 'from-orange-600 to-amber-500',
        description: 'Default organization workspace for Circle',
        ownerId: memberId,
        inviteCode: 'CIR-WELCOME',
      });
      this.em.persist(workspace);

      const wm = new WorkspaceMember({
        id: uuidv4(),
        workspaceId: workspace.id,
        memberId,
        role: 'Owner',
        joinedAt: new Date(),
      });
      this.em.persist(wm);
      await this.em.flush();
      return workspace;
    }

    return null;
  }

  async findAll(memberId?: string): Promise<any[]> {
    await this.ensureDefaultWorkspace(memberId);

    const workspaces = await this.em.find(Workspace, {});

    const rows = await Promise.all(
      workspaces.map(async (ws) => {
        const members = await this.em.find(WorkspaceMember, { workspaceId: ws.id });
        const currentMemberMembership = memberId
          ? members.find((m) => m.memberId === memberId)
          : null;

        // Include workspace ONLY if memberId is a member/owner, or if listing all without memberId filter
        if (!memberId || currentMemberMembership || ws.ownerId === memberId) {
          return {
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            icon: ws.icon,
            description: ws.description,
            ownerId: ws.ownerId,
            inviteCode: ws.inviteCode,
            memberCount: Math.max(members.length, 1),
            role: currentMemberMembership
              ? currentMemberMembership.role
              : ws.ownerId === memberId
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

  async findOne(idOrSlug: string, memberId?: string): Promise<any> {
    const ws = await this.em.findOne(Workspace, {
      $or: [{ id: idOrSlug }, { slug: idOrSlug }],
    });

    if (!ws) {
      throw new NotFoundException(`Workspace "${idOrSlug}" not found`);
    }

    const members = await this.em.find(WorkspaceMember, { workspaceId: ws.id });
    const currentMemberMembership = memberId
      ? members.find((m) => m.memberId === memberId)
      : null;

    return {
      ...ws,
      memberCount: members.length,
      role: currentMemberMembership
        ? currentMemberMembership.role
        : ws.ownerId === memberId
          ? 'Owner'
          : 'Member',
    };
  }

  async create(dto: CreateWorkspaceDto, currentMemberId: string): Promise<any> {
    let rawSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    if (!rawSlug) {
      rawSlug = `workspace-${Math.floor(1000 + Math.random() * 9000)}`;
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

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      icon: workspace.icon,
      description: workspace.description,
      ownerId: workspace.ownerId,
      inviteCode: workspace.inviteCode,
      role: 'Owner',
      memberCount: 1,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async join(dto: JoinWorkspaceDto, currentMemberId: string): Promise<any> {
    const inviteCode = dto.inviteCode?.trim().toUpperCase();
    const slug = dto.slug ? this.slugify(dto.slug) : undefined;

    if (!inviteCode && !slug) {
      throw new BadRequestException(
        'Please provide an invite code or workspace URL/slug',
      );
    }

    const conditions: any[] = [];
    if (inviteCode) {
      conditions.push({ inviteCode });
    }
    if (slug) {
      conditions.push({ slug });
    }

    const workspace = await this.em.findOne(Workspace, {
      $or: conditions,
    });

    if (!workspace) {
      throw new NotFoundException(
        'Workspace not found. Please check your invite code or slug.',
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
        role: workspace.ownerId === currentMemberId ? 'Owner' : 'Member',
        joinedAt: new Date(),
      });
      this.em.persist(membership);
      await this.em.flush();
    }

    const members = await this.em.find(WorkspaceMember, { workspaceId: workspace.id });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      icon: workspace.icon,
      description: workspace.description,
      ownerId: workspace.ownerId,
      inviteCode: workspace.inviteCode,
      role: membership.role,
      memberCount: members.length,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async regenerateInviteCode(
    workspaceId: string,
    _currentMemberId: string,
  ): Promise<string> {
    const workspace = await this.em.findOne(Workspace, {
      $or: [{ id: workspaceId }, { slug: workspaceId }],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const newCode = this.generateInviteCode();
    workspace.inviteCode = newCode;
    await this.em.flush();

    return newCode;
  }
}
