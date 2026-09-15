import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { deriveCycleProgress } from './cycle-progress';
import { CreateCycleDto, UpdateCycleDto } from './dto/cycle.dto';
import { Cycle, Issue } from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class CyclesService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async enrichCycle(cycle: Cycle) {
    const issues = await this.em.find(Issue, { cycleId: cycle.id });
    // Scope and progress are derived from the persisted issues. Stored seed counters
    // must never make an empty cycle look like it contains work.
    const progress = deriveCycleProgress(issues);
    const totalScope = progress.scope;
    const completedCount = progress.completed;
    const startedCount = progress.started;

    const startDateStr = cycle.startDate.toISOString().split('T')[0];
    const endDateStr = cycle.endDate.toISOString().split('T')[0];

    const burnup = cycle.burnup || [];

    const successRate =
      totalScope > 0 ? Math.round((completedCount / totalScope) * 100) : 0;

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
      successRate: cycle.status === 'completed' ? successRate : undefined,
      burnup,
    };
  }

  async findAll(memberId: string, teamId?: string) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (accessibleTeamIds.length === 0) return [];

    const where: any = { teamId: { $in: accessibleTeamIds } };
    if (teamId) {
      if (!accessibleTeamIds.includes(teamId)) return [];
      where.teamId = teamId;
    }

    const cycles = await this.em.find(Cycle, where, {
      orderBy: { number: 'DESC' },
    });

    return Promise.all(cycles.map((c) => this.enrichCycle(c)));
  }

  async findOne(id: string, memberId?: string) {
    const cycle = await this.em.findOne(Cycle, { id });
    if (!cycle) throw new NotFoundException(`Cycle ${id} not found`);
    if (memberId) {
      const accessibleTeamIds =
        await this.workspacesService.getAccessibleTeamIds(memberId);
      if (!accessibleTeamIds.includes(cycle.teamId)) {
        throw new NotFoundException(`Cycle ${id} not found`);
      }
    }
    return this.enrichCycle(cycle);
  }

  async create(dto: CreateCycleDto, memberId: string) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(dto.teamId)) {
      throw new NotFoundException(`Team ${dto.teamId} not found`);
    }

    let number = dto.number;
    let id = dto.id || String(number);
    const existing = await this.em.findOne(Cycle, { id });
    if (existing) {
      const all = await this.em.find(Cycle, { teamId: dto.teamId });
      const maxNum = Math.max(...all.map((c) => c.number || 0), 0);
      number = maxNum + 1;
      id = String(number);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Cycle dates must be valid ISO dates');
    }
    if (endDate < startDate) {
      throw new BadRequestException('Cycle end date must be on or after its start date');
    }

    const cycle = new Cycle({
      id,
      number,
      name: dto.name || `Cycle ${number}`,
      teamId: dto.teamId,
      status: dto.status,
      startDate,
      endDate,
      capacity: dto.capacity || 0,
      scope: 0,
      scopeDelta: 0,
      started: 0,
      completed: 0,
    });

    this.em.persist(cycle);
    await this.em.flush();
    return this.findOne(cycle.id, memberId);
  }

  async update(id: string, dto: UpdateCycleDto, memberId: string) {
    const cycle = await this.em.findOne(Cycle, { id });
    if (!cycle) throw new NotFoundException(`Cycle ${id} not found`);
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(cycle.teamId)) {
      throw new NotFoundException(`Cycle ${id} not found`);
    }

    if (dto.name !== undefined) cycle.name = dto.name;
    if (dto.status !== undefined) cycle.status = dto.status;
    const nextStartDate =
      dto.startDate !== undefined ? new Date(dto.startDate) : cycle.startDate;
    const nextEndDate = dto.endDate !== undefined ? new Date(dto.endDate) : cycle.endDate;
    if (Number.isNaN(nextStartDate.getTime()) || Number.isNaN(nextEndDate.getTime())) {
      throw new BadRequestException('Cycle dates must be valid ISO dates');
    }
    if (nextEndDate < nextStartDate) {
      throw new BadRequestException('Cycle end date must be on or after its start date');
    }
    cycle.startDate = nextStartDate;
    cycle.endDate = nextEndDate;
    if (dto.capacity !== undefined) cycle.capacity = dto.capacity;

    await this.em.flush();
    return this.findOne(id, memberId);
  }

  async delete(id: string, memberId: string) {
    const cycle = await this.em.findOne(Cycle, { id });
    if (!cycle) return { success: true };
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(cycle.teamId)) {
      throw new NotFoundException(`Cycle ${id} not found`);
    }

    // Deleting a cycle returns its issues to the team backlog before hiding the cycle.
    const issues = await this.em.find(Issue, { cycleId: id });
    for (const issue of issues) issue.cycleId = '';
    cycle.deletedAt = new Date();
    await this.em.flush();
    return { success: true };
  }
}
