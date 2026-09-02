import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInitiativeDto, UpdateInitiativeDto } from './dto/initiative.dto';
import { Initiative, Member, toSafeMember } from '../../data-access';

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
  constructor(private readonly em: EntityManager) {}

  private transformInitiative(initiative: Initiative, membersMap: Map<string, any>) {
    const owner = initiative.ownerId ? membersMap.get(initiative.ownerId) : undefined;
    const health = HEALTH_DATA[initiative.healthId] || HEALTH_DATA['on-track'];
    const priority = PRIORITY_DATA[initiative.priorityId] || PRIORITY_DATA['no-priority'];

    return {
      id: initiative.id,
      name: initiative.name,
      description: initiative.description,
      icon: initiative.icon,
      status: initiative.status,
      priority,
      owner,
      target: initiative.target,
      health,
      projectIds: initiative.projectIds || [],
      createdAt: initiative.createdAt
        ? initiative.createdAt.toISOString().split('T')[0]
        : '2026-04-01',
    };
  }

  async findAll() {
    const initiatives = await this.em.find(Initiative, {});
    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return initiatives.map((ini) => this.transformInitiative(ini, membersMap));
  }

  async findOne(id: string) {
    const initiative = await this.em.findOne(Initiative, { id });
    if (!initiative) throw new NotFoundException(`Initiative ${id} not found`);

    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    return this.transformInitiative(initiative, membersMap);
  }

  async create(dto: CreateInitiativeDto) {
    let id = dto.id || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.em.findOne(Initiative, { id });
    if (existing) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    const initiative = new Initiative({
      id,
      name: dto.name,
      description: dto.description,
      icon: dto.icon || '🎯',
      status: dto.status || 'active',
      priorityId: dto.priorityId || 'no-priority',
      ownerId: dto.ownerId,
      target: dto.target,
      healthId: dto.healthId || 'on-track',
      projectIds: dto.projectIds || [],
    });

    this.em.persist(initiative);
    await this.em.flush();
    return this.findOne(id);
  }

  async update(id: string, dto: UpdateInitiativeDto) {
    const initiative = await this.em.findOne(Initiative, { id });
    if (!initiative) throw new NotFoundException(`Initiative ${id} not found`);

    if (dto.name !== undefined) initiative.name = dto.name;
    if (dto.description !== undefined) initiative.description = dto.description;
    if (dto.icon !== undefined) initiative.icon = dto.icon;
    if (dto.status !== undefined) initiative.status = dto.status;
    if (dto.priorityId !== undefined) initiative.priorityId = dto.priorityId;
    if (dto.ownerId !== undefined) initiative.ownerId = dto.ownerId;
    if (dto.target !== undefined) initiative.target = dto.target;
    if (dto.healthId !== undefined) initiative.healthId = dto.healthId;
    if (dto.projectIds !== undefined) initiative.projectIds = dto.projectIds;

    await this.em.flush();
    return this.findOne(id);
  }
}
