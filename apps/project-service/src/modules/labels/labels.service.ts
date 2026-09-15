import { EntityManager } from '@mikro-orm/core';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLabelDto, UpdateLabelDto } from './dto/label.dto';
import { IssueLabel, Label, LabelScope, ProjectLabel } from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async assertWorkspaceMember(memberId: string) {
    const teamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (teamIds.length === 0) throw new NotFoundException('Workspace not found');
  }

  async findAll(memberId: string, scope?: Exclude<LabelScope, 'both'>) {
    await this.assertWorkspaceMember(memberId);
    if (!scope) return this.em.find(Label, {});
    return this.em.find(Label, { scope: { $in: [scope, 'both'] } });
  }

  async findOne(id: string, memberId: string) {
    await this.assertWorkspaceMember(memberId);
    const label = await this.em.findOne(Label, { id });
    if (!label) throw new NotFoundException(`Label ${id} not found`);
    return label;
  }

  async create(dto: CreateLabelDto, memberId: string) {
    await this.assertWorkspaceMember(memberId);
    const name = dto.name.trim();
    const scope = dto.scope ?? 'both';
    const labels = await this.em.find(Label, {});
    const duplicate = labels.some(
      (label) =>
        label.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() &&
        (label.scope === 'both' || scope === 'both' || label.scope === scope),
    );
    if (duplicate) {
      throw new ConflictException(`Label "${name}" already exists in this scope`);
    }

    const label = new Label({ ...dto, name, scope });
    this.em.persist(label);
    await this.em.flush();
    return label;
  }

  async update(id: string, dto: UpdateLabelDto, memberId: string) {
    await this.assertWorkspaceMember(memberId);
    const label = await this.em.findOne(Label, { id });
    if (!label) throw new NotFoundException(`Label ${id} not found`);

    const name = dto.name?.trim() ?? label.name;
    const scope = dto.scope ?? label.scope;
    const labels = await this.em.find(Label, { id: { $ne: id } });
    const duplicate = labels.some(
      (candidate) =>
        candidate.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() &&
        (candidate.scope === 'both' || scope === 'both' || candidate.scope === scope),
    );
    if (duplicate) {
      throw new ConflictException(`Label "${name}" already exists in this scope`);
    }

    Object.assign(label, { ...dto, name, scope });
    await this.em.flush();
    return label;
  }

  async delete(id: string, memberId: string) {
    await this.assertWorkspaceMember(memberId);
    const label = await this.em.findOne(Label, { id });
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
}
