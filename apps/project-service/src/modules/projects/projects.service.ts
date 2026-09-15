import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v7 } from 'uuid';
import {
  CreateMilestoneDto,
  CreateProjectDto,
  CreateProjectUpdateDto,
  UpdateProjectDto,
} from './dto/project.dto';
import {
  Issue,
  Label,
  Member,
  Project,
  ProjectLabel,
  ProjectMember,
  ProjectMilestone,
  ProjectUpdate,
  toSafeMember,
} from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

// Standard status lookup
const STATUS_DATA: Record<
  string,
  { id: string; name: string; color: string; category: string }
> = {
  backlog: { id: 'backlog', name: 'Backlog', color: '#bec2c8', category: 'backlog' },
  'in-progress': {
    id: 'in-progress',
    name: 'In Progress',
    color: '#f2c94c',
    category: 'started',
  },
  done: { id: 'done', name: 'Done', color: '#5e6ad2', category: 'completed' },
  canceled: { id: 'canceled', name: 'Canceled', color: '#95a2b3', category: 'canceled' },
  paused: { id: 'paused', name: 'Paused', color: '#8f9299', category: 'unstarted' },
};

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
export class ProjectsService {
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

  /**
   * Project labels are a replace-all property, like Linear's project label
   * picker. Validate the full set before changing the join table so an invalid
   * label can never be silently ignored by transformProject().
   */
  private async validateLabelIds(labelIds: string[]) {
    const uniqueLabelIds = [...new Set(labelIds)];
    const labels = await this.em.find(Label, {
      id: { $in: uniqueLabelIds },
      scope: { $in: ['project', 'both'] },
    });
    const existingIds = new Set(labels.map((label) => label.id));
    const missingIds = uniqueLabelIds.filter((labelId) => !existingIds.has(labelId));
    if (missingIds.length > 0) {
      throw new BadRequestException(`Unknown project label(s): ${missingIds.join(', ')}`);
    }
    return uniqueLabelIds;
  }

  private transformProject(
    project: Project,
    membersMap: Map<string, any>,
    labelsMap: Map<string, any>,
    projectLabels: ProjectLabel[],
    projectMembers: ProjectMember[],
    issues: Issue[],
  ) {
    const lead = project.leadId ? membersMap.get(project.leadId) : membersMap.get('ln');
    const labelIds = projectLabels
      .filter((pl) => pl.projectId === project.id)
      .map((pl) => pl.labelId);
    const labels = labelIds.map((lid) => labelsMap.get(lid)).filter(Boolean);
    const members = projectMembers
      .filter((pm) => pm.projectId === project.id)
      .map((pm) => membersMap.get(pm.memberId))
      .filter(Boolean);

    const status = STATUS_DATA[project.statusId] || {
      id: project.statusId,
      name: project.statusId,
      color: '#f2c94c',
      category: project.statusCategory || 'started',
    };

    const health = HEALTH_DATA[project.healthId] || HEALTH_DATA['no-update'];
    const priority = PRIORITY_DATA[project.priorityId] || PRIORITY_DATA['no-priority'];

    let healthUpdatedAgoDays: number | undefined;
    if (project.healthUpdatedAt) {
      const diffMs = Date.now() - new Date(project.healthUpdatedAt).getTime();
      healthUpdatedAgoDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Mirrors cycles' enrichCycle(): derive live progress from actual issues,
    // falling back to the stored field only when the project has no issues yet.
    const percentComplete =
      issues.length > 0
        ? Math.round(
            (issues.filter((i) => i.statusCategory === 'completed').length /
              issues.length) *
              100,
          )
        : project.percentComplete;

    return {
      id: project.id,
      name: project.name,
      status,
      icon: project.icon,
      percentComplete,
      issueCount: issues.length,
      startDate: project.startDate
        ? project.startDate.toISOString().split('T')[0]
        : '2025-01-01',
      targetDate: project.targetDate
        ? project.targetDate.toISOString().split('T')[0]
        : undefined,
      lead,
      priority,
      health,
      teamId: project.teamId,
      labels,
      members,
      initiative: project.initiativeId,
      healthUpdatedAgoDays,
      summary: project.summary,
      description: project.description,
      resources: project.resources,
    };
  }

  async findAll(memberId: string, query?: { teamId?: string; health?: string }) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (accessibleTeamIds.length === 0) return [];

    const where: any = { teamId: { $in: accessibleTeamIds } };
    if (query?.teamId) {
      if (!accessibleTeamIds.includes(query.teamId)) return [];
      where.teamId = query.teamId;
    }
    if (query?.health) where.healthId = query.health;

    const projects = await this.em.find(Project, where);
    const members = await this.em.find(Member, {});
    const labels = await this.em.find(Label, { scope: { $in: ['project', 'both'] } });
    const projectLabels = await this.em.find(ProjectLabel, {});
    const projectMembers = await this.em.find(ProjectMember, {});
    const issues = await this.em.find(Issue, {
      projectId: { $in: projects.map((p) => p.id) },
    });

    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));
    const labelsMap = new Map(labels.map((l) => [l.id, l]));
    const issuesByProject = new Map<string, Issue[]>();
    for (const issue of issues) {
      if (!issue.projectId) continue;
      const bucket = issuesByProject.get(issue.projectId) ?? [];
      bucket.push(issue);
      issuesByProject.set(issue.projectId, bucket);
    }

    return projects.map((p) =>
      this.transformProject(
        p,
        membersMap,
        labelsMap,
        projectLabels,
        projectMembers,
        issuesByProject.get(p.id) ?? [],
      ),
    );
  }

  async findOne(id: string, memberId?: string) {
    const project = await this.em.findOne(Project, { id });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    if (memberId) {
      await this.assertTeamAccess(memberId, project.teamId, `Project ${id} not found`);
    }

    const members = await this.em.find(Member, {});
    const labels = await this.em.find(Label, { scope: { $in: ['project', 'both'] } });
    const projectLabels = await this.em.find(ProjectLabel, { projectId: id });
    const projectMembers = await this.em.find(ProjectMember, { projectId: id });
    const issues = await this.em.find(Issue, { projectId: id });

    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));
    const labelsMap = new Map(labels.map((l) => [l.id, l]));

    return this.transformProject(
      project,
      membersMap,
      labelsMap,
      projectLabels,
      projectMembers,
      issues,
    );
  }

  async findDetail(id: string, memberId?: string) {
    const baseProject = await this.findOne(id, memberId);
    const milestones = await this.em.find(
      ProjectMilestone,
      { projectId: id },
      { orderBy: { orderIndex: 'ASC' } },
    );
    const updates = await this.em.find(
      ProjectUpdate,
      { projectId: id },
      { orderBy: { createdAt: 'DESC' } },
    );
    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    const enrichedUpdates = updates.map((u) => ({
      id: u.id,
      author: membersMap.get(u.authorId) || membersMap.get('ln'),
      date: u.createdAt.toISOString().split('T')[0],
      health: u.health,
      blocks: u.blocks,
    }));

    return {
      projectId: id,
      summary: baseProject.summary || `Project ${baseProject.name}`,
      description: baseProject.description || [],
      resources: baseProject.resources || [],
      milestones: milestones.map((m) => ({
        id: m.id,
        name: m.name,
        targetDate: m.targetDate ? m.targetDate.toISOString().split('T')[0] : undefined,
        completed: m.completed,
      })),
      updates: enrichedUpdates,
      activity: [
        {
          id: `act-${id}-1`,
          user: baseProject.lead,
          date: baseProject.startDate,
          text: `created the project ${baseProject.name}`,
        },
      ],
    };
  }

  async create(dto: CreateProjectDto, memberId: string) {
    await this.assertTeamAccess(memberId, dto.teamId, `Team ${dto.teamId} not found`);

    let id = dto.id || v7();
    const existing = await this.em.findOne(Project, { id });
    if (existing) {
      id = v7();
    }
    const project = new Project({
      id,
      name: dto.name,
      teamId: dto.teamId,
      leadId: dto.leadId || 'ln',
      statusId: dto.statusId || 'in-progress',
      statusCategory: dto.statusCategory || 'started',
      priorityId: dto.priorityId || 'no-priority',
      healthId: dto.healthId || 'on-track',
      percentComplete: dto.percentComplete || 0,
      icon: dto.icon || 'Cuboid',
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      initiativeId: dto.initiativeId,
      summary: dto.summary,
      description: dto.description || [],
      resources: dto.resources || [],
      healthUpdatedAt: new Date(),
    });

    this.em.persist(project);

    if (dto.labelIds !== undefined) {
      const labelIds = await this.validateLabelIds(dto.labelIds);
      const plEntities = labelIds.map((lid) => new ProjectLabel(id, lid));
      this.em.persist(plEntities);
    }
    await this.em.flush();

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateProjectDto, memberId: string) {
    const project = await this.em.findOne(Project, { id });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    await this.assertTeamAccess(memberId, project.teamId, `Project ${id} not found`);

    if (dto.teamId !== undefined && dto.teamId !== project.teamId) {
      await this.assertTeamAccess(memberId, dto.teamId, `Project ${id} not found`);
    }

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.teamId !== undefined) project.teamId = dto.teamId;
    if (dto.leadId !== undefined) project.leadId = dto.leadId;
    if (dto.statusId !== undefined) project.statusId = dto.statusId;
    if (dto.statusCategory !== undefined) project.statusCategory = dto.statusCategory;
    if (dto.priorityId !== undefined) project.priorityId = dto.priorityId;
    if (dto.healthId !== undefined) {
      project.healthId = dto.healthId;
      project.healthUpdatedAt = new Date();
    }
    if (dto.percentComplete !== undefined) project.percentComplete = dto.percentComplete;
    if (dto.icon !== undefined) project.icon = dto.icon;
    if (dto.startDate !== undefined) project.startDate = new Date(dto.startDate);
    if (dto.targetDate !== undefined) project.targetDate = new Date(dto.targetDate);
    if (dto.initiativeId !== undefined) project.initiativeId = dto.initiativeId;
    if (dto.summary !== undefined) project.summary = dto.summary;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.resources !== undefined) project.resources = dto.resources;

    if (dto.labelIds !== undefined) {
      const labelIds = await this.validateLabelIds(dto.labelIds);
      const existing = await this.em.find(ProjectLabel, { projectId: id });
      for (const e of existing) {
        this.em.remove(e);
      }
      if (labelIds.length > 0) {
        const newPl = labelIds.map((lid) => new ProjectLabel(id, lid));
        this.em.persist(newPl);
      }
    }

    await this.em.flush();
    return this.findOne(id);
  }

  async delete(id: string, memberId: string) {
    const project = await this.em.findOne(Project, { id });
    if (project) {
      await this.assertTeamAccess(memberId, project.teamId, `Project ${id} not found`);
      this.em.remove(project);
      await this.em.flush();
    }
    return { success: true };
  }

  async addUpdate(projectId: string, dto: CreateProjectUpdateDto, memberId: string) {
    const project = await this.em.findOne(Project, { id: projectId });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    await this.assertTeamAccess(
      memberId,
      project.teamId,
      `Project ${projectId} not found`,
    );

    const update = new ProjectUpdate({
      projectId,
      authorId: memberId,
      health: dto.health,
      blocks: dto.blocks,
    });

    project.healthId = dto.health;
    project.healthUpdatedAt = new Date();

    this.em.persist([update, project]);
    await this.em.flush();
    return this.findDetail(projectId);
  }

  async addMilestone(projectId: string, dto: CreateMilestoneDto, memberId: string) {
    const project = await this.em.findOne(Project, { id: projectId });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    await this.assertTeamAccess(
      memberId,
      project.teamId,
      `Project ${projectId} not found`,
    );

    const milestone = new ProjectMilestone({
      projectId,
      name: dto.name,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      completed: false,
    });

    this.em.persist(milestone);
    await this.em.flush();
    return this.findDetail(projectId);
  }

  async toggleMilestone(projectId: string, milestoneId: string, memberId: string) {
    const project = await this.em.findOne(Project, { id: projectId });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    await this.assertTeamAccess(
      memberId,
      project.teamId,
      `Project ${projectId} not found`,
    );

    const milestone = await this.em.findOne(ProjectMilestone, {
      id: milestoneId,
      projectId,
    });
    if (!milestone) throw new NotFoundException(`Milestone ${milestoneId} not found`);

    milestone.completed = !milestone.completed;
    await this.em.flush();
    return this.findDetail(projectId);
  }
}
