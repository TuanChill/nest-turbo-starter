import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Member, SavedView } from '../../data-access';
import { CreateViewDto, UpdateViewDto } from './dto/view.dto';

@Injectable()
export class ViewsService {
  constructor(private readonly em: EntityManager) {}

  private transformView(view: SavedView, membersMap: Map<string, any>) {
    const owner = membersMap.get(view.ownerId) || membersMap.get('ln');
    return {
      id: view.id,
      name: view.name,
      description: view.description || '',
      icon: view.icon,
      type: view.type,
      teamId: view.teamId,
      owner,
      createdAt: view.createdAt.toISOString().split('T')[0],
      updatedAt: view.updatedAt.toISOString().split('T')[0],
      filter: view.filter || {},
    };
  }

  async findAll(teamId?: string, type?: 'issue' | 'project') {
    const where: any = {};
    if (teamId) where.teamId = teamId;
    if (type) where.type = type;

    const views = await this.em.find(SavedView, where);
    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, m]));

    return views.map((v) => this.transformView(v, membersMap));
  }

  async findOne(id: string) {
    const view = await this.em.findOne(SavedView, { id });
    if (!view) throw new NotFoundException(`View ${id} not found`);

    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, m]));

    return this.transformView(view, membersMap);
  }

  async create(dto: CreateViewDto) {
    let id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.em.findOne(SavedView, { id });
    if (existing) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    const view = new SavedView({
      id,
      name: dto.name,
      description: dto.description || '',
      icon: dto.icon || (dto.type === 'project' ? '📦' : '🧊'),
      type: dto.type || 'issue',
      teamId: dto.teamId,
      ownerId: dto.ownerId || 'ln',
      filter: dto.filter || {},
    });

    this.em.persist(view);
    await this.em.flush();
    return this.findOne(id);
  }

  async update(id: string, dto: UpdateViewDto) {
    const view = await this.em.findOne(SavedView, { id });
    if (!view) throw new NotFoundException(`View ${id} not found`);

    if (dto.name !== undefined) view.name = dto.name;
    if (dto.description !== undefined) view.description = dto.description;
    if (dto.icon !== undefined) view.icon = dto.icon;
    if (dto.type !== undefined) view.type = dto.type;
    if (dto.teamId !== undefined) view.teamId = dto.teamId;
    if (dto.filter !== undefined) view.filter = dto.filter;

    await this.em.flush();
    return this.findOne(id);
  }

  async delete(id: string) {
    const view = await this.em.findOne(SavedView, { id });
    if (view) {
      this.em.remove(view);
      await this.em.flush();
    }
    return { success: true };
  }
}
