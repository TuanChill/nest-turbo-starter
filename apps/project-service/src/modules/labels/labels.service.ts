import { EntityManager } from '@mikro-orm/core';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  Workspace,
} from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

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
    return accessibleWorkspaceIds[0];
  }

  async findAll(memberId: string, scope?: Exclude<LabelScope, 'both'>) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    const where: any = { workspaceId: { $in: workspaceIds } };
    if (scope) where.scope = { $in: [scope, 'both'] };
    return this.em.find(Label, where);
  }

  async findAllGroups(memberId: string, scope?: Exclude<LabelGroupScope, 'both'>) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
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
    const name = dto.name.trim();
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

    const label = new Label({ ...dto, name, scope, workspaceId });
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

    const name = dto.name?.trim() ?? label.name;
    const scope = dto.scope ?? label.scope;
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

    await this.validateGroup(dto.groupId ?? label.groupId, label.workspaceId, scope);

    Object.assign(label, { ...dto, name, scope });
    await this.em.flush();
    return label;
  }

  async delete(id: string, memberId: string) {
    const workspaceIds = await this.getAccessibleWorkspaceIds(memberId);
    const label = await this.em.findOne(Label, {
      id,
      workspaceId: { $in: workspaceIds },
    });
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
    const labels = await this.em.find(Label, { groupId: id });
    if (labels.length > 0) {
      throw new ConflictException('Move or ungroup labels before deleting this group');
    }
    this.em.remove(group);
    await this.em.flush();
    return { success: true };
  }
}
