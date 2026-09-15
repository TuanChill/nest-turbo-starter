import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateInitiativeDto,
  CreateInitiativeUpdateDto,
  UpdateInitiativeDto,
} from './dto/initiative.dto';
import { deriveInitiativeProgress } from './initiative-progress';
import {
  Initiative,
  InitiativeActivity,
  InitiativeUpdate,
  Label,
  LabelGroup,
  Member,
  Project,
  Team,
  toSafeMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import { assertMutuallyExclusiveLabelSelection } from '../labels/label-rules';
import { WorkspacesService } from '../workspaces/workspaces.service';

const HEALTH_DATA: Record<
  string,
  { id: string; name: string; color: string; description: string }
> = {
  'no-update': {
    id: 'no-update',
    name: 'No Update',
    color: '#8f9299',
    description: 'The project has not been updated in the last 30 days.',
  },
  'off-track': {
    id: 'off-track',
    name: 'Off Track',
    color: '#eb5757',
    description: 'The project is not on track and may be delayed.',
  },
  'on-track': {
    id: 'on-track',
    name: 'On Track',
    color: '#4cb782',
    description: 'The project is on track and on schedule.',
  },
  'at-risk': {
    id: 'at-risk',
    name: 'At Risk',
    color: '#f2c94c',
    description: 'The project is at risk and may be delayed.',
  },
};

const PRIORITY_DATA: Record<string, { id: string; name: string }> = {
  'no-priority': { id: 'no-priority', name: 'No priority' },
  urgent: { id: 'urgent', name: 'Urgent' },
  high: { id: 'high', name: 'High' },
  medium: { id: 'medium', name: 'Medium' },
  low: { id: 'low', name: 'Low' },
};

@Injectable()
export class InitiativesService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private transformInitiative(
    initiative: Initiative,
    membersMap: Map<string, any>,
    projects: Project[],
    activities: InitiativeActivity[],
    labels: Label[],
    updates: InitiativeUpdate[],
  ) {
    const owner = initiative.ownerId ? membersMap.get(initiative.ownerId) : undefined;
    const health = HEALTH_DATA[initiative.healthId] || HEALTH_DATA['on-track'];
    const priority = PRIORITY_DATA[initiative.priorityId] || PRIORITY_DATA['no-priority'];
    const projectIds = [
      ...new Set(
        projects
          .filter(
            (project) =>
              project.initiativeId === initiative.id ||
              initiative.projectIds.includes(project.id),
          )
          .map((project) => project.id),
      ),
    ];
    const progress = deriveInitiativeProgress(
      initiative.id,
      projects,
      initiative.projectIds,
    );

    return {
      id: initiative.id,
      workspaceId: initiative.workspaceId,
      name: initiative.name,
      description: initiative.description,
      icon: initiative.icon,
      status: initiative.status,
      priority,
      owner,
      target: initiative.target,
      health,
      projectIds,
      projectCount: progress.projectCount,
      completedProjectCount: progress.completedProjectCount,
      progressPercent: progress.progressPercent,
      labels: labels.filter((label) => initiative.labelIds.includes(label.id)),
      resources: initiative.resources,
      activity: activities.map((activity) => ({
        id: activity.id,
        event: activity.event,
        actor: membersMap.get(activity.actorId),
        metadata: activity.metadata,
        createdAt: activity.createdAt,
      })),
      updates: updates.map((update) => ({
        id: update.id,
        author: membersMap.get(update.authorId) ?? null,
        health: update.health,
        blocks: update.blocks,
        createdAt: update.createdAt,
      })),
      createdAt: initiative.createdAt
        ? initiative.createdAt.toISOString().split('T')[0]
        : undefined,
    };
  }

  private async assertWorkspaceAccess(memberId: string, initiative: Initiative) {
    const workspaceIds = await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    if (!workspaceIds.includes(initiative.workspaceId)) {
      throw new NotFoundException(`Initiative ${initiative.id} not found`);
    }
  }

  private async resolveWorkspaceId(memberId: string, requestedWorkspaceId?: string) {
    const workspaceIds = await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    if (requestedWorkspaceId) {
      if (workspaceIds.includes(requestedWorkspaceId)) return requestedWorkspaceId;
      const workspace = await this.em.findOne(Workspace, {
        $or: [{ id: requestedWorkspaceId }, { slug: requestedWorkspaceId }],
      });
      if (!workspace || !workspaceIds.includes(workspace.id)) {
        throw new NotFoundException(`Workspace ${requestedWorkspaceId} not found`);
      }
      return workspace.id;
    }
    if (workspaceIds.length === 0) {
      throw new NotFoundException('No accessible workspace found');
    }
    return workspaceIds[0];
  }

  private async validateProjectIds(
    memberId: string,
    workspaceId: string,
    projectIds: string[],
  ) {
    const uniqueProjectIds = [...new Set(projectIds)];
    if (uniqueProjectIds.length === 0) return [];

    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    const projects = await this.em.find(Project, { id: { $in: uniqueProjectIds } });
    const teams = await this.em.find(Team, {
      id: { $in: projects.map((project) => project.teamId) },
    });
    const workspaceTeamIds = new Set(
      teams.filter((team) => team.workspaceId === workspaceId).map((team) => team.id),
    );
    const foundIds = new Set(projects.map((project) => project.id));
    const invalid = uniqueProjectIds.filter((projectId) => {
      const project = projects.find((candidate) => candidate.id === projectId);
      return (
        !project ||
        !accessibleTeamIds.includes(project.teamId) ||
        !workspaceTeamIds.has(project.teamId)
      );
    });
    // Keep this explicit so an empty result can never be mistaken for valid input.
    for (const projectId of uniqueProjectIds) {
      if (!foundIds.has(projectId) && !invalid.includes(projectId))
        invalid.push(projectId);
    }
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Project(s) are missing or outside the initiative workspace: ${[...new Set(invalid)].join(', ')}`,
      );
    }
    return uniqueProjectIds;
  }

  private async validateOwnerId(ownerId: string | undefined, workspaceId: string) {
    if (!ownerId) return;
    const membership = await this.em.findOne(WorkspaceMember, {
      workspaceId,
      memberId: ownerId,
    });
    if (!membership) {
      throw new BadRequestException(
        `Owner ${ownerId} is not a member of workspace ${workspaceId}`,
      );
    }
  }

  private async validateLabelIds(labelIds: string[], workspaceId: string) {
    const uniqueIds = [...new Set(labelIds)];
    if (uniqueIds.length === 0) return [];
    const labels = await this.em.find(Label, {
      id: { $in: uniqueIds },
      workspaceId,
      scope: { $in: ['project', 'both'] },
    });
    const found = new Set(labels.map((label) => label.id));
    const missing = uniqueIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown initiative label(s): ${missing.join(', ')}`);
    }
    const groupIds = [...new Set(labels.map((label) => label.groupId).filter(Boolean))];
    const groups = await this.em.find(LabelGroup, {
      id: { $in: groupIds },
      workspaceId,
    });
    assertMutuallyExclusiveLabelSelection(labels, groups);
    return uniqueIds;
  }

  private async loadProjects(initiatives: Initiative[]) {
    const storedIds = [
      ...new Set(initiatives.flatMap((initiative) => initiative.projectIds)),
    ];
    const storedProjects =
      storedIds.length > 0 ? await this.em.find(Project, { id: { $in: storedIds } }) : [];
    const linkedProjects =
      initiatives.length > 0
        ? await this.em.find(Project, {
            initiativeId: { $in: initiatives.map((initiative) => initiative.id) },
          })
        : [];
    const projects = [
      ...new Map([...storedProjects, ...linkedProjects].map((p) => [p.id, p])).values(),
    ];
    return initiatives.map((initiative) =>
      projects.filter(
        (project) =>
          project.initiativeId === initiative.id ||
          initiative.projectIds.includes(project.id),
      ),
    );
  }

  private async loadActivities(initiatives: Initiative[]) {
    if (initiatives.length === 0) return [] as InitiativeActivity[][];
    const activities = await this.em.find(
      InitiativeActivity,
      { initiativeId: { $in: initiatives.map((initiative) => initiative.id) } },
      { orderBy: { createdAt: 'DESC' } },
    );
    return initiatives.map((initiative) =>
      activities.filter((activity) => activity.initiativeId === initiative.id),
    );
  }

  private async loadUpdates(initiatives: Initiative[]) {
    if (initiatives.length === 0) return [] as InitiativeUpdate[][];
    const updates = await this.em.find(
      InitiativeUpdate,
      { initiativeId: { $in: initiatives.map((initiative) => initiative.id) } },
      { orderBy: { createdAt: 'DESC' } },
    );
    return initiatives.map((initiative) =>
      updates.filter((update) => update.initiativeId === initiative.id),
    );
  }

  async findAll(memberId: string) {
    const workspaceIds = await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    if (workspaceIds.length === 0) return [];
    const initiatives = await this.em.find(Initiative, {
      workspaceId: { $in: workspaceIds },
    });
    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));
    const projectsByInitiative = await this.loadProjects(initiatives);
    const activitiesByInitiative = await this.loadActivities(initiatives);
    const updatesByInitiative = await this.loadUpdates(initiatives);
    const labels = await this.em.find(Label, {
      workspaceId: { $in: workspaceIds },
      scope: { $in: ['project', 'both'] },
    });

    return initiatives.map((ini, index) =>
      this.transformInitiative(
        ini,
        membersMap,
        projectsByInitiative[index],
        activitiesByInitiative[index],
        labels,
        updatesByInitiative[index],
      ),
    );
  }

  async findOne(id: string, memberId: string) {
    const initiative = await this.em.findOne(Initiative, { id });
    if (!initiative) throw new NotFoundException(`Initiative ${id} not found`);
    await this.assertWorkspaceAccess(memberId, initiative);

    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));
    const projectsByInitiative = await this.loadProjects([initiative]);
    const activitiesByInitiative = await this.loadActivities([initiative]);
    const updatesByInitiative = await this.loadUpdates([initiative]);
    const labels = await this.em.find(Label, {
      workspaceId: initiative.workspaceId,
      scope: { $in: ['project', 'both'] },
    });

    return this.transformInitiative(
      initiative,
      membersMap,
      projectsByInitiative[0],
      activitiesByInitiative[0],
      labels,
      updatesByInitiative[0],
    );
  }

  async create(dto: CreateInitiativeDto, memberId: string) {
    const workspaceId = await this.resolveWorkspaceId(memberId, dto.workspaceId);
    const projectIds = await this.validateProjectIds(
      memberId,
      workspaceId,
      dto.projectIds || [],
    );
    const labelIds = await this.validateLabelIds(dto.labelIds || [], workspaceId);
    await this.validateOwnerId(dto.ownerId, workspaceId);
    if (dto.priorityId && !PRIORITY_DATA[dto.priorityId]) {
      throw new BadRequestException(`Unknown initiative priority ${dto.priorityId}`);
    }
    if (dto.healthId && !HEALTH_DATA[dto.healthId]) {
      throw new BadRequestException(`Unknown initiative health ${dto.healthId}`);
    }
    let id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.em.findOne(Initiative, { id });
    if (existing) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    const initiative = new Initiative({
      id,
      workspaceId,
      name: dto.name,
      description: dto.description,
      icon: dto.icon || '🎯',
      status: dto.status || 'active',
      priorityId: dto.priorityId || 'no-priority',
      ownerId: dto.ownerId,
      target: dto.target,
      healthId: dto.healthId || 'on-track',
      projectIds,
      labelIds,
      resources: dto.resources || [],
    });

    this.em.persist(initiative);
    this.em.persist(
      new InitiativeActivity({
        initiativeId: id,
        actorId: memberId,
        event: 'created',
        metadata: { name: dto.name },
      }),
    );
    const projects =
      projectIds.length > 0
        ? await this.em.find(Project, { id: { $in: projectIds } })
        : [];
    for (const project of projects) project.initiativeId = id;
    await this.em.flush();
    return this.findOne(id, memberId);
  }

  async update(id: string, dto: UpdateInitiativeDto, memberId: string) {
    const initiative = await this.em.findOne(Initiative, { id });
    if (!initiative) throw new NotFoundException(`Initiative ${id} not found`);
    await this.assertWorkspaceAccess(memberId, initiative);

    if (dto.name !== undefined) initiative.name = dto.name;
    if (dto.description !== undefined) initiative.description = dto.description;
    if (dto.icon !== undefined) initiative.icon = dto.icon;
    if (dto.status !== undefined) initiative.status = dto.status;
    if (dto.priorityId !== undefined) initiative.priorityId = dto.priorityId;
    if (dto.ownerId !== undefined) {
      await this.validateOwnerId(dto.ownerId, initiative.workspaceId);
      initiative.ownerId = dto.ownerId;
    }
    if (dto.target !== undefined) initiative.target = dto.target;
    if (dto.resources !== undefined) initiative.resources = dto.resources;
    if (dto.labelIds !== undefined) {
      initiative.labelIds = await this.validateLabelIds(
        dto.labelIds,
        initiative.workspaceId,
      );
    }
    if (dto.healthId !== undefined) {
      if (!HEALTH_DATA[dto.healthId]) {
        throw new BadRequestException(`Unknown initiative health ${dto.healthId}`);
      }
      initiative.healthId = dto.healthId;
    }
    if (dto.priorityId !== undefined && !PRIORITY_DATA[dto.priorityId]) {
      throw new BadRequestException(`Unknown initiative priority ${dto.priorityId}`);
    }
    if (dto.projectIds !== undefined) {
      const projectIds = await this.validateProjectIds(
        memberId,
        initiative.workspaceId,
        dto.projectIds,
      );
      const nextIds = new Set(projectIds);
      const previousIds = new Set(initiative.projectIds);
      const projectsToUnlink = await this.em.find(Project, {
        id: { $in: [...previousIds].filter((projectId) => !nextIds.has(projectId)) },
        initiativeId: initiative.id,
      });
      for (const project of projectsToUnlink) project.initiativeId = undefined;
      const projectsToLink = await this.em.find(Project, { id: { $in: projectIds } });
      for (const project of projectsToLink) project.initiativeId = initiative.id;
      initiative.projectIds = projectIds;
    }

    const changedFields = Object.keys(dto);
    if (changedFields.length > 0) {
      this.em.persist(
        new InitiativeActivity({
          initiativeId: id,
          actorId: memberId,
          event: 'updated',
          metadata: { fields: changedFields },
        }),
      );
    }

    await this.em.flush();
    return this.findOne(id, memberId);
  }

  async delete(id: string, memberId: string) {
    const initiative = await this.em.findOne(Initiative, { id });
    if (!initiative) return { success: true };
    await this.assertWorkspaceAccess(memberId, initiative);
    const projects = await this.em.find(Project, { initiativeId: id });
    for (const project of projects) project.initiativeId = undefined;
    this.em.persist(
      new InitiativeActivity({
        initiativeId: id,
        actorId: memberId,
        event: 'deleted',
      }),
    );
    initiative.deletedAt = new Date();
    await this.em.flush();
    return { success: true };
  }

  async addUpdate(id: string, dto: CreateInitiativeUpdateDto, memberId: string) {
    const initiative = await this.em.findOne(Initiative, { id });
    if (!initiative) throw new NotFoundException(`Initiative ${id} not found`);
    await this.assertWorkspaceAccess(memberId, initiative);
    initiative.healthId = dto.health;
    this.em.persist(
      new InitiativeUpdate({
        initiativeId: id,
        authorId: memberId,
        health: dto.health,
        blocks: dto.blocks ?? [],
      }),
    );
    this.em.persist(
      new InitiativeActivity({
        initiativeId: id,
        actorId: memberId,
        event: 'posted an update',
        metadata: { health: dto.health },
      }),
    );
    await this.em.flush();
    return this.findOne(id, memberId);
  }
}
