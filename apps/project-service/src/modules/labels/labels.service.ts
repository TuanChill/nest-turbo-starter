import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateLabelDto,
  CreateLabelGroupDto,
  UpdateLabelDto,
  UpdateLabelGroupDto,
} from './dto/label.dto';
import {
  IssueLabel,
  Label,
  LabelGroup,
  LabelGroupScope,
  LabelScope,
  ProjectLabel,
  Team,
  TeamMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import { canManageTeamRole, canManageWorkspaceRole } from '../access-control';
import { requireWorkspaceSelection } from '../workspaces/workspace-selection';
import { WorkspacesService } from '../workspaces/workspaces.service';

const RESERVED_LABEL_NAMES = new Set([
  'assignee',
  'cycle',
  'effort',
  'estimate',
  'hours',
  'priority',
  'project',
  'state',
  'status',
]);
const MAX_LABELS_PER_GROUP = 250;

@Injectable()
export class LabelsService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async getAccessibleWorkspaceIds(memberId: string) {
    const workspaceIds = await this.workspacesService.getAccessibleWorkspaceIds(memberId);
    if (workspaceIds.length === 0) throw new NotFoundException('Workspace not found');
    return workspaceIds;
  }

  private async resolveWorkspaceId(memberId: string, requestedWorkspaceId?: string) {
    const accessibleWorkspaceIds = await this.getAccessibleWorkspaceIds(memberId);
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
    return requireWorkspaceSelection(accessibleWorkspaceIds);
  }

  private async validateTeamId(
    teamId: string | undefined,
    workspaceId: string,
    memberId: string,
  ) {
    if (!teamId) return undefined;
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    const team = await this.em.findOne(Team, { id: teamId });
    if (
      !team ||
      team.workspaceId !== workspaceId ||
      !accessibleTeamIds.includes(teamId)
    ) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }
    return teamId;
  }

  async findAll(
    memberId: string,
    scope?: Exclude<LabelScope, 'both'>,
    requestedWorkspaceId?: string,
    requestedTeamId?: string,
    includeArchived = false,
  ) {
    const workspaceIds = requestedWorkspaceId
      ? [await this.resolveWorkspaceId(memberId, requestedWorkspaceId)]
      : await this.getAccessibleWorkspaceIds(memberId);
    const where: any = { workspaceId: { $in: workspaceIds } };
    if (!includeArchived) where.archivedAt = null;
    if (scope) where.scope = { $in: [scope, 'both'] };
    if (requestedTeamId) {
      const accessibleTeamIds =
        await this.workspacesService.getAccessibleTeamIds(memberId);
      if (!accessibleTeamIds.includes(requestedTeamId)) {
        throw new NotFoundException(`Team ${requestedTeamId} not found`);
      }
      const targetTeam = await this.em.findOne(Team, { id: requestedTeamId });
      if (
        !targetTeam ||
        !targetTeam.workspaceId ||
        !workspaceIds.includes(targetTeam.workspaceId)
      ) {
        throw new NotFoundException(`Team ${requestedTeamId} not found`);
      }
      where.$or = [{ teamId: null }, { teamId: requestedTeamId }];
    }
    return this.em.find(Label, where);
  }

  async findAllGroups(
    memberId: string,
    scope?: Exclude<LabelGroupScope, 'both'>,
    requestedWorkspaceId?: string,
  ) {
    const workspaceIds = requestedWorkspaceId
      ? [await this.resolveWorkspaceId(memberId, requestedWorkspaceId)]
      : await this.getAccessibleWorkspaceIds(memberId);
    const where: any = { workspaceId: { $in: workspaceIds } };
    if (scope) where.scope = { $in: [scope, 'both'] };
    return this.em.find(LabelGroup, where, { orderBy: { name: 'asc' } });
  }

  private async validateGroup(
    groupId: string | undefined,
    workspaceId: string,
    scope: LabelScope,
  ) {
    if (!groupId) return;
    const group = await this.em.findOne(LabelGroup, { id: groupId, workspaceId });
    if (!group) throw new NotFoundException(`Label group ${groupId} not found`);
    if (group.scope !== 'both' && scope !== 'both' && group.scope !== scope) {
      throw new ConflictException('Label scope must match its label group scope');
    }
  }

  private validateLabelName(name: string) {
    if (!name) throw new BadRequestException('Label name cannot be empty');
    if (RESERVED_LABEL_NAMES.has(name.toLocaleLowerCase())) {
      throw new ConflictException(`Label name "${name}" is reserved`);
    }
  }

  private async validateGroupCapacity(
    groupId: string | undefined,
    workspaceId: string,
    excludedLabelId?: string,
  ) {
    if (!groupId) return;
    const groupedLabels = await this.em.find(Label, {
      workspaceId,
      groupId,
      ...(excludedLabelId ? { id: { $ne: excludedLabelId } } : {}),
    });
    if (groupedLabels.length >= MAX_LABELS_PER_GROUP) {
      throw new ConflictException(
        `A label group cannot contain more than ${MAX_LABELS_PER_GROUP} labels`,
      );
    }
  }

  private async assertLabelManager(
    memberId: string,
    workspaceId: string,
    teamId?: string,
  ) {
    const workspace = await this.em.findOne(Workspace, { id: workspaceId });
    if (!workspace) throw new NotFoundException(`Workspace ${workspaceId} not found`);

    if (teamId) {
      const team = await this.em.findOne(Team, { id: teamId });
      const [workspaceMembership, teamMembership] = await Promise.all([
        this.em.findOne(WorkspaceMember, { workspaceId, memberId }),
        this.em.findOne(TeamMember, { teamId, memberId }),
      ]);
      if (
        !team ||
        team.workspaceId !== workspaceId ||
        (!canManageTeamRole(workspaceMembership?.role, teamMembership?.role) &&
          workspace.ownerId !== memberId)
      ) {
        throw new NotFoundException(`Label team ${teamId} not found`);
      }
      return;
    }

    const membership = await this.em.findOne(WorkspaceMember, {
      workspaceId,
      memberId,
    });
    if (workspace.ownerId !== memberId && !canManageWorkspaceRole(membership?.role)) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }
  }

  async findOne(id: string, memberId: string) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    const label = await this.em.findOne(Label, {
      id,
      workspaceId: { $in: workspaceIds },
    });
    if (!label) throw new NotFoundException(`Label ${id} not found`);
    return label;
  }

  async create(dto: CreateLabelDto, memberId: string) {
    const workspaceId = await this.resolveWorkspaceId(memberId, dto.workspaceId);
    const teamId = await this.validateTeamId(dto.teamId, workspaceId, memberId);
    await this.assertLabelManager(memberId, workspaceId, teamId);
    const name = dto.name.trim();
    this.validateLabelName(name);
    const scope = dto.scope ?? 'both';
    const labels = await this.em.find(Label, { workspaceId });
    const duplicate = labels.some(
      (label) =>
        label.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() &&
        (label.scope === 'both' || scope === 'both' || label.scope === scope),
    );
    if (duplicate) {
      throw new ConflictException(`Label "${name}" already exists in this scope`);
    }

    await this.validateGroup(dto.groupId, workspaceId, scope);
    await this.validateGroupCapacity(dto.groupId, workspaceId);

    const label = new Label({ ...dto, name, scope, workspaceId, teamId });
    this.em.persist(label);
    await this.em.flush();
    return label;
  }

  async update(id: string, dto: UpdateLabelDto, memberId: string) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    const label = await this.em.findOne(Label, {
      id,
      workspaceId: { $in: workspaceIds },
    });
    if (!label) throw new NotFoundException(`Label ${id} not found`);

    await this.assertLabelManager(memberId, label.workspaceId, label.teamId);

    const name = dto.name?.trim() ?? label.name;
    if (dto.name !== undefined) this.validateLabelName(name);
    const scope = dto.scope ?? label.scope;
    const nextTeamId = dto.teamId === null ? undefined : (dto.teamId ?? label.teamId);
    const teamId = await this.validateTeamId(nextTeamId, label.workspaceId, memberId);
    if (teamId !== label.teamId) {
      await this.assertLabelManager(memberId, label.workspaceId, teamId);
    }
    const labels = await this.em.find(Label, {
      id: { $ne: id },
      workspaceId: label.workspaceId,
    });
    const duplicate = labels.some(
      (candidate) =>
        candidate.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() &&
        (candidate.scope === 'both' || scope === 'both' || candidate.scope === scope),
    );
    if (duplicate) {
      throw new ConflictException(`Label "${name}" already exists in this scope`);
    }

    const nextGroupId = dto.groupId ?? label.groupId;
    await this.validateGroup(nextGroupId, label.workspaceId, scope);
    await this.validateGroupCapacity(nextGroupId, label.workspaceId, id);

    const { archived, ...labelPatch } = dto;
    Object.assign(label, { ...labelPatch, name, scope, teamId, groupId: nextGroupId });
    if (archived !== undefined) {
      label.archivedAt = archived ? new Date() : undefined;
    }
    await this.em.flush();
    return label;
  }

  async delete(id: string, memberId: string) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    const label = await this.em.findOne(Label, {
      id,
      workspaceId: { $in: workspaceIds },
    });
    if (label) await this.assertLabelManager(memberId, label.workspaceId, label.teamId);
    if (label) {
      const [issueLinks, projectLinks] = await Promise.all([
        this.em.find(IssueLabel, { labelId: id }),
        this.em.find(ProjectLabel, { labelId: id }),
      ]);
      this.em.remove([...issueLinks, ...projectLinks]);
      this.em.remove(label);
      await this.em.flush();
    }
    return { success: true };
  }

  async createGroup(dto: CreateLabelGroupDto, memberId: string) {
    const workspaceId = await this.resolveWorkspaceId(memberId, dto.workspaceId);
    await this.assertLabelManager(memberId, workspaceId);
    const name = dto.name.trim();
    const scope = dto.scope ?? 'issue';
    const duplicate = await this.em.findOne(LabelGroup, {
      workspaceId,
      name: { $ilike: name },
    });
    if (duplicate) throw new ConflictException(`Label group "${name}" already exists`);

    const group = new LabelGroup({
      ...dto,
      name,
      scope,
      workspaceId,
      mutuallyExclusive: dto.mutuallyExclusive ?? false,
    });
    this.em.persist(group);
    await this.em.flush();
    return group;
  }

  async updateGroup(id: string, dto: UpdateLabelGroupDto, memberId: string) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    const group = await this.em.findOne(LabelGroup, {
      id,
      workspaceId: { $in: workspaceIds },
    });
    if (!group) throw new NotFoundException(`Label group ${id} not found`);

    await this.assertLabelManager(memberId, group.workspaceId);

    const name = dto.name?.trim() ?? group.name;
    const scope = dto.scope ?? group.scope;
    const duplicate = await this.em.findOne(LabelGroup, {
      id: { $ne: id },
      workspaceId: group.workspaceId,
      name: { $ilike: name },
    });
    if (duplicate) throw new ConflictException(`Label group "${name}" already exists`);

    const labels = await this.em.find(Label, { groupId: id });
    if (
      labels.some(
        (label) => label.scope !== 'both' && scope !== 'both' && label.scope !== scope,
      )
    ) {
      throw new ConflictException(
        'Label group scope must include every label in the group',
      );
    }
    Object.assign(group, { ...dto, name, scope });
    await this.em.flush();
    return group;
  }

  async deleteGroup(id: string, memberId: string) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    const group = await this.em.findOne(LabelGroup, {
      id,
      workspaceId: { $in: workspaceIds },
    });
    if (!group) throw new NotFoundException(`Label group ${id} not found`);
    await this.assertLabelManager(memberId, group.workspaceId);
    const labels = await this.em.find(Label, { groupId: id });
    if (labels.length > 0) {
      throw new ConflictException('Move or ungroup labels before deleting this group');
    }
    this.em.remove(group);
    await this.em.flush();
    return { success: true };
  }
}
