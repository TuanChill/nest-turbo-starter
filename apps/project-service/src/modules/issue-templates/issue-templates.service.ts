import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateIssueTemplateDto, UpdateIssueTemplateDto } from './dto/issue-template.dto';
import {
  issueTemplateReferencesSameTeam,
  normalizeIssueTemplateConfig,
} from './issue-template-config';
import {
  Cycle,
  IssueTemplate,
  IssueTemplateConfig,
  Label,
  LabelGroup,
  Member,
  Project,
  Team,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import { assertMutuallyExclusiveLabelSelection } from '../labels/label-rules';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class IssueTemplatesService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
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
    const team = await this.em.findOne(Team, { id: teamId });
    if (!team || team.workspaceId !== workspaceId)
      throw new BadRequestException(
        'The selected team does not belong to this workspace',
      );
    if (!accessible.includes(teamId))
      throw new NotFoundException(`Team ${teamId} not found`);
    return team;
  }

  private async validateConfig(
    config: IssueTemplateConfig,
    workspaceId: string,
    teamId: string | undefined,
    memberId: string,
  ) {
    let projectTeamId: string | undefined;
    let cycleTeamId: string | undefined;
    if (teamId) await this.assertTeamAccess(teamId, workspaceId, memberId);
    if (config.assigneeId) {
      const [assignee, workspaceMembership] = await Promise.all([
        this.em.findOne(Member, { id: config.assigneeId }),
        this.em.findOne(WorkspaceMember, {
          workspaceId,
          memberId: config.assigneeId,
        }),
      ]);
      if (!assignee || !workspaceMembership) {
        throw new BadRequestException(
          'The template assignee is not a member of the target workspace',
        );
      }
    }
    if (config.labelIds?.length) {
      const labels = await this.em.find(Label, {
        id: { $in: config.labelIds },
        scope: { $in: ['issue', 'both'] },
        workspaceId,
      });
      const existing = new Set(labels.map((label) => label.id));
      const missing = config.labelIds.filter((id) => !existing.has(id));
      if (missing.length) {
        throw new BadRequestException(`Unknown issue label(s): ${missing.join(', ')}`);
      }
      const groupIds = [...new Set(labels.map((label) => label.groupId).filter(Boolean))];
      const groups = await this.em.find(LabelGroup, {
        id: { $in: groupIds },
        workspaceId,
      });
      assertMutuallyExclusiveLabelSelection(labels, groups);
    }
    if (config.projectId) {
      const project = await this.em.findOne(Project, { id: config.projectId });
      if (!project)
        throw new BadRequestException('The template project no longer exists');
      await this.assertTeamAccess(project.teamId, workspaceId, memberId);
      projectTeamId = project.teamId;
      if (teamId && project.teamId !== teamId) {
        throw new BadRequestException('The template project belongs to another team');
      }
    }
    if (config.cycleId) {
      const cycle = await this.em.findOne(Cycle, { id: config.cycleId });
      if (!cycle) throw new BadRequestException('The template cycle no longer exists');
      await this.assertTeamAccess(cycle.teamId, workspaceId, memberId);
      cycleTeamId = cycle.teamId;
      if (teamId && cycle.teamId !== teamId) {
        throw new BadRequestException('The template cycle belongs to another team');
      }
    }
    if (!issueTemplateReferencesSameTeam(projectTeamId, cycleTeamId)) {
      throw new BadRequestException(
        'The template project and cycle must belong to the same team',
      );
    }
  }

  private async clearDefault(workspaceId: string, teamId: string, exceptId?: string) {
    const defaults = await this.em.find(IssueTemplate, {
      workspaceId,
      teamId,
      isDefault: true,
      ...(exceptId ? { id: { $ne: exceptId } } : {}),
    });
    for (const template of defaults) template.isDefault = false;
  }

  async findAll(memberId: string, workspaceId?: string, teamId?: string) {
    const workspaceIds = workspaceId
      ? [(await this.assertWorkspaceAccess(workspaceId, memberId)).id]
      : (await this.em.find(WorkspaceMember, { memberId })).map(
          (item) => item.workspaceId,
        );
    if (!workspaceIds.length) return [];
    if (teamId) {
      const team = await this.em.findOne(Team, { id: teamId });
      if (!team || !team.workspaceId || !workspaceIds.includes(team.workspaceId))
        return [];
      await this.assertTeamAccess(teamId, team.workspaceId, memberId);
    }
    const where: any = { workspaceId: { $in: workspaceIds } };
    if (teamId) where.$or = [{ scope: 'workspace' }, { scope: 'team', teamId }];
    return this.em.find(IssueTemplate, where, { orderBy: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, memberId: string) {
    const template = await this.em.findOne(IssueTemplate, { id });
    if (!template) throw new NotFoundException(`Issue template ${id} not found`);
    await this.assertWorkspaceAccess(template.workspaceId, memberId);
    if (template.scope === 'team' && template.teamId)
      await this.assertTeamAccess(template.teamId, template.workspaceId, memberId);
    return template;
  }

  async create(dto: CreateIssueTemplateDto, memberId: string) {
    const workspace = await this.assertWorkspaceAccess(dto.workspaceId, memberId);
    if (dto.scope === 'team' && !dto.teamId)
      throw new BadRequestException('teamId is required for a team template');
    if (dto.teamId) await this.assertTeamAccess(dto.teamId, workspace.id, memberId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Template name is required');
    const duplicate = await this.em.findOne(IssueTemplate, {
      workspaceId: workspace.id,
      name,
      deletedAt: null,
    });
    if (duplicate) throw new ConflictException(`Template "${name}" already exists`);
    const config = normalizeIssueTemplateConfig(dto.config);
    await this.validateConfig(config, workspace.id, dto.teamId, memberId);
    if (dto.isDefault && dto.teamId) await this.clearDefault(workspace.id, dto.teamId);
    const template = new IssueTemplate({
      workspaceId: workspace.id,
      name,
      description: dto.description?.trim(),
      scope: dto.scope,
      teamId: dto.scope === 'team' ? dto.teamId : undefined,
      createdBy: memberId,
      isDefault: dto.isDefault ?? false,
      config,
    });
    this.em.persist(template);
    await this.em.flush();
    return template;
  }

  async update(id: string, dto: UpdateIssueTemplateDto, memberId: string) {
    const template = await this.findOne(id, memberId);
    const scope = dto.scope ?? template.scope;
    const teamId = dto.teamId ?? template.teamId;
    if (scope === 'team' && !teamId)
      throw new BadRequestException('teamId is required for a team template');
    const config = dto.config
      ? normalizeIssueTemplateConfig(dto.config)
      : template.config;
    await this.validateConfig(config, template.workspaceId, teamId, memberId);
    const name = dto.name?.trim() || template.name;
    const duplicate = await this.em.findOne(IssueTemplate, {
      workspaceId: template.workspaceId,
      name,
      id: { $ne: id },
      deletedAt: null,
    });
    if (duplicate) throw new ConflictException(`Template "${name}" already exists`);
    if (dto.isDefault && teamId)
      await this.clearDefault(template.workspaceId, teamId, id);
    Object.assign(template, {
      name,
      description:
        dto.description === undefined ? template.description : dto.description.trim(),
      scope,
      teamId: scope === 'team' ? teamId : undefined,
      isDefault: dto.isDefault ?? template.isDefault,
      config,
    });
    await this.em.flush();
    return template;
  }

  async duplicate(id: string, memberId: string) {
    const source = await this.findOne(id, memberId);
    await this.validateConfig(source.config, source.workspaceId, source.teamId, memberId);
    const copy = new IssueTemplate({
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
    template.deletedAt = new Date();
    template.isDefault = false;
    await this.em.flush();
    return { success: true };
  }
}
