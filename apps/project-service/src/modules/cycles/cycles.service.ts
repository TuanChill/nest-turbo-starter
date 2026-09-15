import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v7 } from 'uuid';
import { allocateCycleId, allocateCycleNumber } from './cycle-allocation';
import {
  calculateIdealProgress,
  mergeCycleBurnup,
  toCycleBurnupPoint,
} from './cycle-history';
import { deriveCycleProgress } from './cycle-progress';
import { cycleIssueWhere } from './cycle-scope';
import { CreateCycleDto, UpdateCycleDto } from './dto/cycle.dto';
import { Cycle, CycleHistory, Issue } from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class CyclesService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async recordSnapshot(
    cycle: Cycle,
    progress: ReturnType<typeof deriveCycleProgress>,
    recordedOn = new Date(),
  ) {
    const day = new Date(
      Date.UTC(
        recordedOn.getUTCFullYear(),
        recordedOn.getUTCMonth(),
        recordedOn.getUTCDate(),
      ),
    );
    const existing = await this.em.findOne(CycleHistory, {
      cycleId: cycle.id,
      recordedOn: day,
    });
    const values = {
      scope: progress.scope,
      started: progress.started,
      completed: progress.completed,
      ideal: calculateIdealProgress(cycle.startDate, cycle.endDate, day, progress.scope),
    };
    if (existing) {
      Object.assign(existing, values);
    } else {
      this.em.persist(
        new CycleHistory({
          id: v7(),
          cycleId: cycle.id,
          recordedOn: day,
          ...values,
        }),
      );
    }
    await this.em.flush();
  }

  private async getHistoricalBurnup(cycle: Cycle) {
    const snapshots = await this.em.find(
      CycleHistory,
      { cycleId: cycle.id },
      { orderBy: { recordedOn: 'ASC' } },
    );
    return mergeCycleBurnup(
      Array.isArray(cycle.burnup) ? cycle.burnup : [],
      snapshots.map(toCycleBurnupPoint),
    );
  }

  private async enrichCycle(cycle: Cycle) {
    const issues = await this.em.find(Issue, cycleIssueWhere(cycle.id, cycle.teamId));
    // Scope and progress are derived from the persisted issues. Stored seed counters
    // must never make an empty cycle look like it contains work.
    const progress = deriveCycleProgress(issues);
    const totalScope = progress.scope;
    const completedCount = progress.completed;
    const startedCount = progress.started;

    const startDateStr = cycle.startDate.toISOString().split('T')[0];
    const endDateStr = cycle.endDate.toISOString().split('T')[0];

    await this.recordSnapshot(cycle, progress);
    const burnup = await this.getHistoricalBurnup(cycle);

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

  async history(id: string, memberId: string) {
    const cycle = await this.em.findOne(Cycle, { id });
    if (!cycle) throw new NotFoundException(`Cycle ${id} not found`);
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(cycle.teamId)) {
      throw new NotFoundException(`Cycle ${id} not found`);
    }
    const issues = await this.em.find(Issue, cycleIssueWhere(cycle.id, cycle.teamId));
    await this.recordSnapshot(cycle, deriveCycleProgress(issues));
    return this.getHistoricalBurnup(cycle);
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

    const all = await this.em.find(Cycle, { teamId: dto.teamId });
    const number = allocateCycleNumber(
      all.map((cycle) => cycle.number || 0),
      dto.number,
    );
    const generatedId = v7();
    const requestedIdExists = dto.id
      ? Boolean(await this.em.findOne(Cycle, { id: dto.id }))
      : false;
    const id = allocateCycleId(dto.id, requestedIdExists, generatedId);

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
    const issues = await this.em.find(Issue, cycleIssueWhere(id, cycle.teamId));
    for (const issue of issues) issue.cycleId = '';
    cycle.deletedAt = new Date();
    await this.em.flush();
    return { success: true };
  }
}
