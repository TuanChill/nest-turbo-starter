import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateViewDto, UpdateViewDto } from './dto/view.dto';
import {
  Member,
  SavedView,
  Team,
  toSafeMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ViewsService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async assertViewAccess(
    memberId: string,
    view: SavedView,
    notFoundMessage: string,
  ) {
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    if (!accessibleWorkspaceIds.includes(view.workspaceId)) {
      throw new NotFoundException(notFoundMessage);
    }
    if (view.ownerId === memberId) return;
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!view.teamId || !accessibleTeamIds.includes(view.teamId)) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private async assertTeamTargetAccess(memberId: string, teamId: string) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(teamId)) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }
  }

  private async assertTeamInWorkspace(teamId: string, workspaceId: string) {
    const team = await this.em.findOne(Team, { id: teamId });
    if (!team || team.workspaceId !== workspaceId) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }
  }

  private async resolveWorkspaceId(memberId: string, requestedWorkspaceId?: string) {
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    if (requestedWorkspaceId) {
      if (accessibleWorkspaceIds.includes(requestedWorkspaceId))
        return requestedWorkspaceId;
      const workspace = await this.em.findOne(Workspace, {
        $or: [{ id: requestedWorkspaceId }, { slug: requestedWorkspaceId }],
      });
      if (!workspace || !accessibleWorkspaceIds.includes(workspace.id)) {
        throw new NotFoundException(`Workspace ${requestedWorkspaceId} not found`);
      }
      return workspace.id;
    }
    if (accessibleWorkspaceIds.length === 0) {
      throw new NotFoundException('No accessible workspace found');
    }
    return accessibleWorkspaceIds[0];
  }

  private transformView(view: SavedView, membersMap: Map<string, any>) {
    const owner = membersMap.get(view.ownerId);
    return {
      id: view.id,
      workspaceId: view.workspaceId,
      name: view.name,
      description: view.description || '',
      icon: view.icon,
      type: view.type,
      teamId: view.teamId,
      projectId: view.projectId,
      layout: view.layout || 'list',
      owner,
      createdAt: view.createdAt.toISOString().split('T')[0],
      updatedAt: view.updatedAt.toISOString().split('T')[0],
      filter: view.filter || {},
    };
  }

  async findAll(
    memberId: string,
    teamId?: string,
    type?: 'issue' | 'project',
    projectId?: string,
  ) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    const accessibleWorkspaceIds =
      await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    if (accessibleWorkspaceIds.length === 0) return [];

    const where: any = { workspaceId: { $in: accessibleWorkspaceIds } };
    if (teamId) {
      if (!accessibleTeamIds.includes(teamId)) return [];
      where.teamId = teamId;
    } else {
      where.$or = [{ ownerId: memberId }, { teamId: { $in: accessibleTeamIds } }];
    }
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;

    const views = await this.em.find(SavedView, where);
    const ownerIds = [...new Set(views.map((view) => view.ownerId))];
    const memberships = await this.em.find(WorkspaceMember, {
      workspaceId: { $in: accessibleWorkspaceIds },
      memberId: { $in: ownerIds },
    });
    const visibleOwnerIds = [
      ...new Set(memberships.map((membership) => membership.memberId)),
    ];
    const members = await this.em.find(Member, { id: { $in: visibleOwnerIds } });
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return views.map((v) => this.transformView(v, membersMap));
  }

  async findOne(id: string, memberId?: string) {
    const view = await this.em.findOne(SavedView, { id });
    if (!view) throw new NotFoundException(`View ${id} not found`);
    if (memberId) {
      await this.assertViewAccess(memberId, view, `View ${id} not found`);
    }

    const memberships = await this.em.find(WorkspaceMember, {
      workspaceId: view.workspaceId,
      memberId: view.ownerId,
    });
    const members = memberships.length
      ? await this.em.find(Member, { id: view.ownerId })
      : [];
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return this.transformView(view, membersMap);
  }

  async create(dto: CreateViewDto, ownerId: string) {
    const workspaceId = await this.resolveWorkspaceId(ownerId, dto.workspaceId);
    if (dto.teamId) {
      await this.assertTeamTargetAccess(ownerId, dto.teamId);
      await this.assertTeamInWorkspace(dto.teamId, workspaceId);
    }
    let id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.em.findOne(SavedView, { id });
    if (existing) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    const view = new SavedView({
      id,
      workspaceId,
      name: dto.name,
      description: dto.description || '',
      icon: dto.icon || (dto.type === 'project' ? '📦' : '🧊'),
      type: dto.type || 'issue',
      teamId: dto.teamId,
      projectId: dto.projectId,
      layout: dto.layout || 'list',
      ownerId,
      filter: dto.filter || {},
    });

    this.em.persist(view);
    await this.em.flush();
    return this.findOne(id, ownerId);
  }

  async update(id: string, dto: UpdateViewDto, memberId: string) {
    const view = await this.em.findOne(SavedView, { id });
    if (!view) throw new NotFoundException(`View ${id} not found`);
    await this.assertViewAccess(memberId, view, `View ${id} not found`);
    if (dto.teamId !== undefined && dto.teamId !== view.teamId) {
      await this.assertTeamTargetAccess(memberId, dto.teamId);
      await this.assertTeamInWorkspace(dto.teamId, view.workspaceId);
    }

    if (dto.name !== undefined) view.name = dto.name;
    if (dto.description !== undefined) view.description = dto.description;
    if (dto.icon !== undefined) view.icon = dto.icon;
    if (dto.type !== undefined) view.type = dto.type;
    if (dto.teamId !== undefined) view.teamId = dto.teamId;
    if (dto.projectId !== undefined) view.projectId = dto.projectId;
    if (dto.layout !== undefined) view.layout = dto.layout;
    if (dto.filter !== undefined) view.filter = dto.filter;

    await this.em.flush();
    return this.findOne(id, memberId);
  }

  async delete(id: string, memberId: string) {
    const view = await this.em.findOne(SavedView, { id });
    if (view) {
      await this.assertViewAccess(memberId, view, `View ${id} not found`);
      this.em.remove(view);
      await this.em.flush();
    }
    return { success: true };
  }
}
