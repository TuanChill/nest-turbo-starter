import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateProjectTemplateDto,
  InstantiateProjectTemplateDto,
  UpdateProjectTemplateDto,
} from './dto/project-template.dto';
import {
  Initiative,
  Label,
  LabelGroup,
  ProjectMember,
  ProjectTemplate,
  Team,
  TeamMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import type {
  ProjectTemplateConfig,
  ProjectTemplateRelationType,
} from '../../data-access';
import { canManageTeamRole, canManageWorkspaceRole } from '../access-control';
import { IssuesService } from '../issues/issues.service';
import { assertMutuallyExclusiveLabelSelection } from '../labels/label-rules';
import { ProjectsService } from '../projects/projects.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ProjectTemplatesService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
    private readonly projectsService: ProjectsService,
    private readonly issuesService: IssuesService,
  ) {}

  private async resolveWorkspace(idOrSlug: string) {
    const workspace = await this.em.findOne(Workspace, {
      $or: [{ id: idOrSlug }, { slug: idOrSlug }],
    });
    if (!workspace) throw new NotFoundException(`Workspace ${idOrSlug} not found`);
    return workspace;
  }

  private async assertWorkspaceAccess(idOrSlug: string, memberId: string) {
    const workspace = await this.resolveWorkspace(idOrSlug);
    const membership = await this.em.findOne(WorkspaceMember, {
      workspaceId: workspace.id,
      memberId,
    });
    if (!membership && workspace.ownerId !== memberId)
      throw new NotFoundException(`Workspace ${workspace.id} not found`);
    return workspace;
  }

  private async assertTeamAccess(teamId: string, workspaceId: string, memberId: string) {
    const accessible = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessible.includes(teamId))
      throw new NotFoundException(`Team ${teamId} not found`);
    const team = await this.em.findOne(Team, { id: teamId });
    if (!team || team.workspaceId !== workspaceId)
      throw new BadRequestException(
        'The selected team does not belong to this workspace',
      );
    return team;
  }

  private async assertTemplateManager(
    workspaceId: string,
    scope: 'workspace' | 'team',
    teamId: string | undefined,
    memberId: string,
  ) {
    const workspace = await this.resolveWorkspace(workspaceId);
    const workspaceMembership = await this.em.findOne(WorkspaceMember, {
      workspaceId,
      memberId,
    });
    if (scope === 'workspace') {
      if (
        workspace.ownerId !== memberId &&
        !canManageWorkspaceRole(workspaceMembership?.role)
      ) {
        throw new NotFoundException(`Workspace ${workspaceId} not found`);
      }
      return;
    }
    if (!teamId) throw new BadRequestException('teamId is required for a team template');
    const [team, teamMembership] = await Promise.all([
      this.em.findOne(Team, { id: teamId }),
      this.em.findOne(TeamMember, { teamId, memberId }),
    ]);
    if (
      !team ||
      team.workspaceId !== workspaceId ||
      (workspace.ownerId !== memberId &&
        !canManageTeamRole(workspaceMembership?.role, teamMembership?.role))
    ) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }
  }

  private normalizeConfig(config?: ProjectTemplateConfig): ProjectTemplateConfig {
    const source = config ?? {};
    return {
      project: { ...(source.project ?? {}) },
      milestones: (source.milestones ?? []).map((item, index) => ({
        key: item.key || `milestone-${index + 1}`,
        name: item.name.trim(),
        targetDate: item.targetDate,
        orderIndex: item.orderIndex ?? index,
      })),
      issues: (source.issues ?? []).map((item, index) => ({
        ...item,
        key: item.key || `issue-${index + 1}`,
        title: item.title.trim(),
      })),
      relations: (source.relations ?? []).map((relation) => ({
        sourceKey: relation.sourceKey,
        targetKey: relation.targetKey,
        relationType: relation.relationType,
      })),
    };
  }

  private async validateScope(
    scope: 'workspace' | 'team',
    teamId: string | undefined,
    workspaceId: string,
    memberId: string,
  ) {
    if (scope === 'team' && !teamId)
      throw new BadRequestException('teamId is required for a team template');
    if (teamId) await this.assertTeamAccess(teamId, workspaceId, memberId);
  }

  async findAll(memberId: string, workspaceId?: string, teamId?: string) {
    const workspaceIds = workspaceId
      ? [(await this.assertWorkspaceAccess(workspaceId, memberId)).id]
      : (await this.em.find(WorkspaceMember, { memberId })).map(
          (item) => item.workspaceId,
        );
    if (workspaceIds.length === 0) return [];
    if (teamId) {
      const team = await this.em.findOne(Team, { id: teamId });
      if (!team || !team.workspaceId || !workspaceIds.includes(team.workspaceId))
        return [];
      await this.assertTeamAccess(teamId, team.workspaceId, memberId);
    }
    const where: any = { workspaceId: { $in: workspaceIds } };
    if (teamId) where.$or = [{ scope: 'workspace' }, { scope: 'team', teamId }];
    return this.em.find(ProjectTemplate, where, { orderBy: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, memberId: string) {
    const template = await this.em.findOne(ProjectTemplate, { id });
    if (!template) throw new NotFoundException(`Project template ${id} not found`);
    await this.assertWorkspaceAccess(template.workspaceId, memberId);
    if (template.scope === 'team' && template.teamId)
      await this.assertTeamAccess(template.teamId, template.workspaceId, memberId);
    return template;
  }

  async create(dto: CreateProjectTemplateDto, memberId: string) {
    const workspace = await this.assertWorkspaceAccess(dto.workspaceId, memberId);
    await this.validateScope(dto.scope, dto.teamId, workspace.id, memberId);
    await this.assertTemplateManager(workspace.id, dto.scope, dto.teamId, memberId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Template name is required');
    const duplicate = await this.em.findOne(ProjectTemplate, {
      workspaceId: workspace.id,
      name,
      deletedAt: null,
    });
    if (duplicate) throw new ConflictException(`Template "${name}" already exists`);
    if (dto.isDefault && dto.teamId) await this.clearDefault(dto.teamId, workspace.id);
    const template = new ProjectTemplate({
      workspaceId: workspace.id,
      name,
      description: dto.description?.trim(),
      scope: dto.scope,
      teamId: dto.scope === 'team' ? dto.teamId : undefined,
      createdBy: memberId,
      isDefault: dto.isDefault ?? false,
      config: this.normalizeConfig(dto.config),
    });
    this.em.persist(template);
    await this.em.flush();
    return template;
  }

  async update(id: string, dto: UpdateProjectTemplateDto, memberId: string) {
    const template = await this.findOne(id, memberId);
    const scope = dto.scope ?? template.scope;
    const teamId = dto.teamId ?? template.teamId;
    await this.validateScope(scope, teamId, template.workspaceId, memberId);
    await this.assertTemplateManager(template.workspaceId, scope, teamId, memberId);
    const name = dto.name?.trim() || template.name;
    const duplicate = await this.em.findOne(ProjectTemplate, {
      workspaceId: template.workspaceId,
      name,
      id: { $ne: id },
      deletedAt: null,
    });
    if (duplicate) throw new ConflictException(`Template "${name}" already exists`);
    if (dto.isDefault && teamId)
      await this.clearDefault(teamId, template.workspaceId, id);
    Object.assign(template, {
      name,
      description:
        dto.description === undefined ? template.description : dto.description.trim(),
      scope,
      teamId: scope === 'team' ? teamId : undefined,
      isDefault: dto.isDefault ?? template.isDefault,
      config: dto.config ? this.normalizeConfig(dto.config) : template.config,
    });
    await this.em.flush();
    return template;
  }

  async duplicate(id: string, memberId: string) {
    const source = await this.findOne(id, memberId);
    await this.assertTemplateManager(
      source.workspaceId,
      source.scope,
      source.teamId,
      memberId,
    );
    const copy = new ProjectTemplate({
      workspaceId: source.workspaceId,
      name: `${source.name} copy`,
      description: source.description,
      scope: source.scope,
      teamId: source.teamId,
      createdBy: memberId,
      config: JSON.parse(JSON.stringify(source.config)),
    });
    this.em.persist(copy);
    await this.em.flush();
    return copy;
  }

  async delete(id: string, memberId: string) {
    const template = await this.findOne(id, memberId);
    await this.assertTemplateManager(
      template.workspaceId,
      template.scope,
      template.teamId,
      memberId,
    );
    template.deletedAt = new Date();
    template.isDefault = false;
    await this.em.flush();
    return { success: true };
  }

  private async clearDefault(teamId: string, workspaceId: string, exceptId?: string) {
    const defaults = await this.em.find(ProjectTemplate, {
      teamId,
      workspaceId,
      isDefault: true,
      ...(exceptId ? { id: { $ne: exceptId } } : {}),
    });
    for (const template of defaults) template.isDefault = false;
  }

  private sortedIssues(config: ProjectTemplateConfig) {
    const issues = [...(config.issues ?? [])];
    const byKey = new Map(issues.map((issue) => [issue.key, issue]));
    const depth = (key: string, seen = new Set<string>()): number => {
      const issue = byKey.get(key);
      if (!issue?.parentKey || !byKey.has(issue.parentKey) || seen.has(key)) return 0;
      seen.add(key);
      return 1 + depth(issue.parentKey, seen);
    };
    return issues.sort((a, b) => depth(a.key) - depth(b.key));
  }

  private async validateInstantiationReferences(
    config: ProjectTemplateConfig,
    workspaceId: string,
  ) {
    const projectConfig = config.project ?? {};
    const memberIds = [
      ...new Set(
        [projectConfig.leadId, ...(projectConfig.memberIds ?? [])].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ];
    if (memberIds.length > 0) {
      const memberships = await this.em.find(WorkspaceMember, {
        workspaceId,
        memberId: { $in: memberIds },
      });
      const memberIdsInWorkspace = new Set(
        memberships.map((membership) => membership.memberId),
      );
      const missingMembers = memberIds.filter(
        (memberId) => !memberIdsInWorkspace.has(memberId),
      );
      if (missingMembers.length > 0) {
        throw new BadRequestException(
          `Template members are outside the target workspace: ${missingMembers.join(', ')}`,
        );
      }
    }

    if (projectConfig.initiativeId) {
      const initiative = await this.em.findOne(Initiative, {
        id: projectConfig.initiativeId,
        workspaceId,
      });
      if (!initiative) {
        throw new BadRequestException(
          `Initiative ${projectConfig.initiativeId} is not available in the target workspace`,
        );
      }
    }

    const templateTeamIds = [...new Set(projectConfig.teamIds ?? [])];
    if (templateTeamIds.length > 0) {
      const teams = await this.em.find(Team, {
        id: { $in: templateTeamIds },
        workspaceId,
      });
      const availableTeamIds = new Set(teams.map((team) => team.id));
      const missingTeamIds = templateTeamIds.filter(
        (teamId) => !availableTeamIds.has(teamId),
      );
      if (missingTeamIds.length > 0) {
        throw new BadRequestException(
          `Template teams are outside the target workspace: ${missingTeamIds.join(', ')}`,
        );
      }
    }

    const projectLabelIds = projectConfig.labelIds ?? [];
    const issueLabelIds = (config.issues ?? []).flatMap((issue) => issue.labelIds ?? []);
    const labelIds = [...new Set([...projectLabelIds, ...issueLabelIds])];
    if (labelIds.length > 0) {
      const labels = await this.em.find(Label, {
        id: { $in: labelIds },
        workspaceId,
      });
      const labelsById = new Map(labels.map((label) => [label.id, label]));
      const invalidProjectLabels = projectLabelIds.filter(
        (labelId) =>
          !labelsById.get(labelId) ||
          !['project', 'both'].includes(labelsById.get(labelId)!.scope),
      );
      const invalidIssueLabels = issueLabelIds.filter(
        (labelId) =>
          !labelsById.get(labelId) ||
          !['issue', 'both'].includes(labelsById.get(labelId)!.scope),
      );
      if (invalidProjectLabels.length > 0 || invalidIssueLabels.length > 0) {
        throw new BadRequestException(
          `Template contains invalid labels for the target fields: ${[...new Set([...invalidProjectLabels, ...invalidIssueLabels])].join(', ')}`,
        );
      }
      const groupIds = [...new Set(labels.map((label) => label.groupId).filter(Boolean))];
      const groups = await this.em.find(LabelGroup, {
        id: { $in: groupIds },
        workspaceId,
      });
      assertMutuallyExclusiveLabelSelection(
        projectLabelIds.map((labelId) => labelsById.get(labelId)).filter(Boolean),
        groups,
      );
      for (const issue of config.issues ?? []) {
        assertMutuallyExclusiveLabelSelection(
          (issue.labelIds ?? [])
            .map((labelId) => labelsById.get(labelId))
            .filter(Boolean),
          groups,
        );
      }
    }

    const milestoneKeyList = (config.milestones ?? []).map((milestone) => milestone.key);
    const issueKeyList = (config.issues ?? []).map((issue) => issue.key);
    const milestoneKeys = new Set(milestoneKeyList);
    const issueKeys = new Set(issueKeyList);
    const invalidReferences: string[] = [];
    for (const key of milestoneKeyList.filter(
      (candidate, index) => milestoneKeyList.indexOf(candidate) !== index,
    )) {
      invalidReferences.push(`${key}.duplicateMilestoneKey`);
    }
    for (const key of issueKeyList.filter(
      (candidate, index) => issueKeyList.indexOf(candidate) !== index,
    )) {
      invalidReferences.push(`${key}.duplicateIssueKey`);
    }
    for (const issue of config.issues ?? []) {
      if (
        issue.parentKey &&
        (!issueKeys.has(issue.parentKey) || issue.parentKey === issue.key)
      ) {
        invalidReferences.push(`${issue.key}.parentKey`);
      }
      if (issue.milestoneKey && !milestoneKeys.has(issue.milestoneKey)) {
        invalidReferences.push(`${issue.key}.milestoneKey`);
      }
    }
    const validRelationTypes = new Set<ProjectTemplateRelationType>([
      'blocks',
      'blocked_by',
      'relates_to',
      'duplicate_of',
    ]);
    const relationKeys = new Set<string>();
    for (const relation of config.relations ?? []) {
      const relationKey = `${relation.sourceKey}:${relation.targetKey}:${relation.relationType}`;
      if (
        !issueKeys.has(relation.sourceKey) ||
        !issueKeys.has(relation.targetKey) ||
        relation.sourceKey === relation.targetKey
      ) {
        invalidReferences.push(`${relationKey}.issueKey`);
      }
      if (!validRelationTypes.has(relation.relationType)) {
        invalidReferences.push(`${relationKey}.relationType`);
      }
      if (relationKeys.has(relationKey)) {
        invalidReferences.push(`${relationKey}.duplicate`);
      }
      relationKeys.add(relationKey);
    }
    const parentGraph = new Map(
      (config.issues ?? [])
        .filter((issue) => issue.parentKey)
        .map((issue) => [issue.key, issue.parentKey!]),
    );
    for (const key of issueKeys) {
      const seen = new Set<string>();
      let current: string | undefined = key;
      while (current) {
        if (seen.has(current)) {
          invalidReferences.push(`${key}.parentKey cycle`);
          break;
        }
        seen.add(current);
        current = parentGraph.get(current);
      }
    }
    if (invalidReferences.length > 0) {
      throw new BadRequestException(
        `Template contains invalid references: ${[...new Set(invalidReferences)].join(', ')}`,
      );
    }
  }

  async instantiate(id: string, dto: InstantiateProjectTemplateDto, memberId: string) {
    const template = await this.findOne(id, memberId);
    await this.assertTeamAccess(dto.teamId, template.workspaceId, memberId);
    if (template.scope === 'team' && template.teamId !== dto.teamId)
      throw new BadRequestException(
        'This team template can only be used by its configured team',
      );
    const config = this.normalizeConfig(template.config);
    await this.validateInstantiationReferences(config, template.workspaceId);
    const projectConfig = config.project ?? {};
    const overrides = dto.overrides ?? {};
    const projectOverrides = overrides as {
      summary?: unknown;
      description?: unknown;
      resources?: unknown;
      icon?: unknown;
      statusId?: unknown;
      statusCategory?: unknown;
      priorityId?: unknown;
      healthId?: unknown;
      percentComplete?: unknown;
      leadId?: unknown;
      initiativeId?: unknown;
      labelIds?: unknown;
      startDate?: unknown;
      targetDate?: unknown;
      teamIds?: unknown;
    };
    const overrideString = (key: keyof typeof projectOverrides, fallback?: string) =>
      typeof projectOverrides[key] === 'string' ? projectOverrides[key] : fallback;
    const overrideNumber = (key: keyof typeof projectOverrides, fallback?: number) =>
      typeof projectOverrides[key] === 'number' ? projectOverrides[key] : fallback;
    const overrideStringArray = (
      key: keyof typeof projectOverrides,
      fallback?: string[],
    ) =>
      Array.isArray(projectOverrides[key]) &&
      projectOverrides[key].every((value) => typeof value === 'string')
        ? (projectOverrides[key] as string[])
        : fallback;
    const memberIds = projectConfig.memberIds ?? [];
    const project = await this.em.transactional(async () => {
      const created = await this.projectsService.create(
        {
          name: dto.name.trim(),
          teamId: dto.teamId,
          teamIds: overrideStringArray('teamIds', projectConfig.teamIds),
          summary:
            typeof projectOverrides.summary === 'string'
              ? projectOverrides.summary
              : projectConfig.summary,
          description: Array.isArray(projectOverrides.description)
            ? projectOverrides.description
            : projectConfig.description,
          resources: Array.isArray(projectOverrides.resources)
            ? projectOverrides.resources
            : projectConfig.resources,
          icon: overrideString('icon', projectConfig.icon),
          statusId: overrideString('statusId', projectConfig.statusId),
          statusCategory: overrideString('statusCategory', projectConfig.statusCategory),
          priorityId: overrideString('priorityId', projectConfig.priorityId),
          healthId: overrideString('healthId', projectConfig.healthId),
          percentComplete: overrideNumber(
            'percentComplete',
            projectConfig.percentComplete,
          ),
          leadId: overrideString('leadId', projectConfig.leadId),
          initiativeId: overrideString('initiativeId', projectConfig.initiativeId),
          labelIds: overrideStringArray('labelIds', projectConfig.labelIds),
          startDate: overrideString('startDate', projectConfig.startDate),
          targetDate: overrideString('targetDate', projectConfig.targetDate),
        },
        memberId,
      );
      this.em.persist(
        memberIds.map(
          (templateMemberId) =>
            new ProjectMember({ projectId: created.id, memberId: templateMemberId }),
        ),
      );
      const milestoneNames = new Map<string, string>();
      for (const milestone of config.milestones ?? []) {
        // oxlint-disable-next-line no-await-in-loop -- the created milestone name is needed for issue remapping
        const detail = await this.projectsService.addMilestone(
          created.id,
          { name: milestone.name, targetDate: milestone.targetDate },
          memberId,
        );
        const createdMilestone = detail.milestones.find(
          (item) => item.name === milestone.name,
        );
        if (createdMilestone) milestoneNames.set(milestone.key, createdMilestone.name);
      }
      const issueIds = new Map<string, string>();
      const issueIdentifiers = new Map<string, string>();
      for (const snapshot of this.sortedIssues(config)) {
        // oxlint-disable-next-line no-await-in-loop -- parent issue IDs are generated by the previous iteration
        const issue = await this.issuesService.create(
          {
            title: snapshot.title,
            description: snapshot.description,
            descriptionBlocks: snapshot.descriptionBlocks,
            statusId: snapshot.statusId,
            statusCategory: snapshot.statusCategory,
            priorityId: snapshot.priorityId,
            assigneeId: snapshot.assigneeId,
            labelIds: snapshot.labelIds,
            parentIssueId: snapshot.parentKey
              ? issueIds.get(snapshot.parentKey)
              : undefined,
            projectId: created.id,
            teamId: dto.teamId,
            milestone: snapshot.milestoneKey
              ? milestoneNames.get(snapshot.milestoneKey)
              : undefined,
            dueDate: snapshot.dueDate,
            rank: snapshot.rank,
          },
          memberId,
        );
        issueIds.set(snapshot.key, issue.id);
        issueIdentifiers.set(snapshot.key, issue.identifier);
      }
      for (const relation of config.relations ?? []) {
        const sourceIdentifier = issueIdentifiers.get(relation.sourceKey);
        const targetIdentifier = issueIdentifiers.get(relation.targetKey);
        if (!sourceIdentifier || !targetIdentifier) {
          throw new BadRequestException(
            `Template relation references an issue that was not cloned: ${relation.sourceKey} -> ${relation.targetKey}`,
          );
        }
        // Relation creation stays inside the same transaction as the project and
        // issues. A failed relation therefore rolls back the complete clone.
        // oxlint-disable-next-line no-await-in-loop -- preserve relation order and fail atomically.
        await this.issuesService.addRelation(
          sourceIdentifier,
          {
            targetIdentifier,
            relationType: relation.relationType,
          },
          memberId,
        );
      }
      return created;
    });
    return this.projectsService.findOne(project.id, memberId);
  }
}
