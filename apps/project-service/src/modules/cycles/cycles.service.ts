import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Cycle, Issue } from '../../data-access';
import { CreateCycleDto, UpdateCycleDto } from './dto/cycle.dto';

interface CycleBurnupPoint {
  date: string;
  scope: number;
  started: number;
  completed: number;
  ideal: number;
}

function generateBurnup(
  startDateStr: string,
  days: number,
  startScope: number,
  endScope: number,
  completedTarget: number,
  startedTarget: number,
): CycleBurnupPoint[] {
  const points: CycleBurnupPoint[] = [];
  const start = new Date(startDateStr);

  for (let i = 0; i <= days; i++) {
    const t = i / days;
    const eased = t * t * (3 - 2 * t);
    const scope = Math.round(startScope + (endScope - startScope) * Math.min(1, t * 1.35));
    const completed = Math.round(completedTarget * eased);
    const started = Math.min(
      scope - completed,
      Math.round(startedTarget * (0.4 + 0.6 * Math.sin(t * Math.PI))),
    );
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    points.push({
      date: date.toISOString().split('T')[0],
      scope,
      started: completed + Math.max(0, started),
      completed,
      ideal: Math.round(endScope * t),
    });
  }

  return points;
}

@Injectable()
export class CyclesService {
  constructor(private readonly em: EntityManager) {}

  private async enrichCycle(cycle: Cycle) {
    const issues = await this.em.find(Issue, { cycleId: cycle.id });
    const totalScope = issues.length > 0 ? issues.length : cycle.scope;
    const completedCount = issues.length > 0
      ? issues.filter((i) => i.statusCategory === 'completed').length
      : cycle.completed;
    const startedCount = issues.length > 0
      ? issues.filter((i) => i.statusCategory === 'started').length
      : cycle.started;

    const startDateStr = cycle.startDate.toISOString().split('T')[0];
    const endDateStr = cycle.endDate.toISOString().split('T')[0];

    let burnup = cycle.burnup;
    if (!burnup || burnup.length === 0) {
      if (cycle.status === 'current' || cycle.status === 'completed') {
        const days = Math.max(
          1,
          Math.round(
            (new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        burnup = generateBurnup(
          startDateStr,
          days,
          Math.max(1, Math.round(totalScope * 0.8)),
          totalScope,
          completedCount,
          startedCount,
        );
      }
    }

    const successRate = totalScope > 0 ? Math.round((completedCount / totalScope) * 100) : 0;

    return {
      id: cycle.id,
      number: cycle.number,
      name: cycle.name,
      teamId: cycle.teamId,
      status: cycle.status,
      startDate: startDateStr,
      endDate: endDateStr,
      capacity: cycle.capacity,
      scope: totalScope,
      scopeDelta: cycle.scopeDelta,
      started: startedCount,
      completed: completedCount,
      successRate: cycle.status === 'completed' ? (cycle.successRate ?? successRate) : undefined,
      burnup,
    };
  }

  async findAll(teamId?: string) {
    const where: any = {};
    if (teamId) where.teamId = teamId;

    const cycles = await this.em.find(Cycle, where, {
      orderBy: { number: 'DESC' },
    });

    return Promise.all(cycles.map((c) => this.enrichCycle(c)));
  }

  async findOne(id: string) {
    const cycle = await this.em.findOne(Cycle, { id });
    if (!cycle) throw new NotFoundException(`Cycle ${id} not found`);
    return this.enrichCycle(cycle);
  }

  async create(dto: CreateCycleDto) {
    let number = dto.number;
    let id = dto.id || String(number);
    const existing = await this.em.findOne(Cycle, { id });
    if (existing) {
      const all = await this.em.find(Cycle, {});
      const maxNum = Math.max(...all.map((c) => c.number || 0), 20);
      number = maxNum + 1;
      id = String(number);
    }

    const cycle = new Cycle({
      id,
      number,
      name: dto.name || `Cycle ${number}`,
      teamId: dto.teamId,
      status: dto.status,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      capacity: dto.capacity || 0,
      scope: 0,
      scopeDelta: 0,
      started: 0,
      completed: 0,
    });

    this.em.persist(cycle);
    await this.em.flush();
    return this.findOne(cycle.id);
  }

  async update(id: string, dto: UpdateCycleDto) {
    const cycle = await this.em.findOne(Cycle, { id });
    if (!cycle) throw new NotFoundException(`Cycle ${id} not found`);

    if (dto.name !== undefined) cycle.name = dto.name;
    if (dto.status !== undefined) cycle.status = dto.status;
    if (dto.startDate !== undefined) cycle.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) cycle.endDate = new Date(dto.endDate);
    if (dto.capacity !== undefined) cycle.capacity = dto.capacity;

    await this.em.flush();
    return this.findOne(id);
  }
}
