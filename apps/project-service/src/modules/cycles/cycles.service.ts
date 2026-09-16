import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v7 } from 'uuid';
import { allocateCycleId, allocateCycleNumber } from './cycle-allocation';
import { estimateCycleCapacity } from './cycle-capacity';
import {
  calculateIdealProgress,
  mergeCycleBurnup,
  toCycleBurnupPoint,
} from './cycle-history';
import { deriveCycleProgress } from './cycle-progress';
import { cycleIssueWhere } from './cycle-scope';
import {
  addCalendarDays,
  calendarDateInTimeZone,
  cycleEndDate,
  getCycleSettingsValidationError,
  nextCycleStart,
  nextStartOnWeekday,
} from './cycle-settings';
import { CreateCycleDto, UpdateCycleDto, UpdateCycleSettingsDto } from './dto/cycle.dto';
import { Cycle, CycleHistory, CycleSettings, Issue, TeamMember } from '../../data-access';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class CyclesService {
  constructor(
    private readonly em: EntityManager,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private async assertTeamAccess(teamId: string, memberId: string) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (!accessibleTeamIds.includes(teamId)) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }
  }

  private serializeSettings(settings: CycleSettings) {
    return {
      teamId: settings.teamId,
      enabled: settings.enabled,
      durationWeeks: settings.durationWeeks,
      startDayOfWeek: settings.startDayOfWeek,
      timeZone: settings.timeZone,
      cooldownDays: settings.cooldownDays,
      upcomingCycleCount: settings.upcomingCycleCount,
      autoAddActiveIssues: settings.autoAddActiveIssues,
    };
  }

  private async ensureUpcomingCycles(teamId: string, settings: CycleSettings) {
    if (!settings.enabled) return;

    const cycles = await this.em.find(
      Cycle,
      { teamId },
      { orderBy: { endDate: 'DESC' } },
    );
    const scheduled = cycles.filter(
      (cycle) => cycle.status === 'upcoming' || cycle.status === 'planned',
    );
    const missing = Math.max(0, settings.upcomingCycleCount - scheduled.length);
    if (missing === 0) return;

    const todayStart = calendarDateInTimeZone(new Date(), settings.timeZone);
    const latest = cycles[0];
    let startDate = latest
      ? nextCycleStart(latest.endDate, settings.cooldownDays)
      : nextStartOnWeekday(todayStart, settings.startDayOfWeek);
    if (startDate < todayStart) {
      startDate = nextStartOnWeekday(todayStart, settings.startDayOfWeek);
    }
    const existingDates = new Set(
      cycles.map((cycle) => cycle.startDate.toISOString().slice(0, 10)),
    );
    const existingNumbers = cycles.map((cycle) => cycle.number || 0);

    for (let index = 0; index < missing; index += 1) {
      while (existingDates.has(startDate.toISOString().slice(0, 10))) {
        startDate = addCalendarDays(
          startDate,
          settings.durationWeeks * 7 + settings.cooldownDays,
        );
      }
      const number = allocateCycleNumber(existingNumbers, undefined);
      const endDate = cycleEndDate(startDate, settings.durationWeeks);
      const status =
        startDate <= todayStart && endDate >= todayStart ? 'current' : 'upcoming';
      this.em.persist(
        new Cycle({
          id: v7(),
          number,
          name: `Cycle ${number}`,
          teamId,
          status,
          startDate,
          endDate,
          capacity: 0,
          scope: 0,
          scopeDelta: 0,
          started: 0,
          completed: 0,
        }),
      );
      existingDates.add(startDate.toISOString().slice(0, 10));
      existingNumbers.push(number);
      startDate = addCalendarDays(
        startDate,
        settings.durationWeeks * 7 + settings.cooldownDays,
      );
    }
    await this.em.flush();
  }

  private async syncCycleAutomation(teamId: string, settings: CycleSettings) {
    if (!settings.enabled) return;

    await this.ensureUpcomingCycles(teamId, settings);
    const cycles = await this.em.find(
      Cycle,
      { teamId },
      { orderBy: { startDate: 'ASC' } },
    );
    const todayStart = calendarDateInTimeZone(new Date(), settings.timeZone);
    const closingCycles = cycles.filter(
      (cycle) => cycle.endDate < todayStart && cycle.status !== 'completed',
    );
    const currentCycle = cycles.find(
      (cycle) => cycle.startDate <= todayStart && cycle.endDate >= todayStart,
    );
    const nextCycle = cycles.find((cycle) => cycle.startDate > todayStart);
    const completedCycles = cycles.filter(
      (cycle) => cycle.endDate < todayStart && cycle.status === 'completed',
    );
    const previousCycle = completedCycles[completedCycles.length - 1];
    let changed = false;

    for (const cycle of cycles) {
      if (cycle.endDate < todayStart && cycle.status !== 'completed') {
        cycle.status = 'completed';
        changed = true;
      } else if (currentCycle?.id === cycle.id && cycle.status !== 'current') {
        cycle.status = 'current';
        changed = true;
      } else if (
        cycle.startDate > todayStart &&
        cycle.status !== 'upcoming' &&
        cycle.status !== 'planned'
      ) {
        cycle.status = 'upcoming';
        changed = true;
      }
    }

    const rolloverTarget = currentCycle ?? nextCycle;
    if (rolloverTarget) {
      const unfinishedByCycle = await Promise.all(
        closingCycles.map((closingCycle) =>
          this.em.find(Issue, {
            teamId,
            cycleId: closingCycle.id,
            statusCategory: { $in: ['unstarted', 'started'] },
          }),
        ),
      );
      for (const unfinished of unfinishedByCycle.flat()) {
        if (unfinished.cycleId !== rolloverTarget.id) {
          unfinished.cycleId = rolloverTarget.id;
          changed = true;
        }
      }
    }

    if (settings.autoAddActiveIssues) {
      const activeIssues = await this.em.find(Issue, {
        teamId,
        cycleId: '',
        statusCategory: { $in: ['started', 'completed'] },
      });
      for (const issue of activeIssues) {
        const target =
          issue.statusCategory === 'completed'
            ? (currentCycle ?? previousCycle)
            : (currentCycle ?? nextCycle);
        if (target && issue.cycleId !== target.id) {
          issue.cycleId = target.id;
          changed = true;
        }
      }
    }

    if (changed) await this.em.flush();
  }

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

  private async enrichCycle(cycle: Cycle, capacity = cycle.capacity) {
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
      capacity,
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

  private async deriveCapacityByCycle(cycles: Cycle[]) {
    if (cycles.length === 0) return new Map<string, number>();

    const cycleIds = cycles.map((cycle) => cycle.id);
    const teamIds = [...new Set(cycles.map((cycle) => cycle.teamId))];
    const issues = await this.em.find(Issue, {
      teamId: { $in: teamIds },
      cycleId: { $in: cycleIds },
    });
    const teamMembers = await this.em.find(TeamMember, { teamId: { $in: teamIds } });
    const scopeByCycle = new Map<string, number>();
    for (const issue of issues) {
      if (issue.cycleId) {
        scopeByCycle.set(issue.cycleId, (scopeByCycle.get(issue.cycleId) ?? 0) + 1);
      }
    }
    const membersByTeam = new Map<string, number>();
    for (const member of teamMembers) {
      membersByTeam.set(member.teamId, (membersByTeam.get(member.teamId) ?? 0) + 1);
    }

    const capacityByCycle = new Map<string, number>();
    for (const cycle of cycles) {
      const previousCompletedScopes = cycles
        .filter(
          (candidate) =>
            candidate.teamId === cycle.teamId &&
            candidate.status === 'completed' &&
            candidate.endDate < cycle.startDate,
        )
        .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
        .slice(0, 3)
        .map((candidate) => scopeByCycle.get(candidate.id) ?? 0);
      capacityByCycle.set(
        cycle.id,
        estimateCycleCapacity(
          scopeByCycle.get(cycle.id) ?? 0,
          previousCompletedScopes,
          membersByTeam.get(cycle.teamId) ?? 0,
        ),
      );
    }
    return capacityByCycle;
  }

  async findAll(memberId: string, teamId?: string) {
    const accessibleTeamIds = await this.workspacesService.getAccessibleTeamIds(memberId);
    if (accessibleTeamIds.length === 0) return [];

    const where: any = { teamId: { $in: accessibleTeamIds } };
    if (teamId) {
      if (!accessibleTeamIds.includes(teamId)) return [];
      const settings = await this.em.findOne(CycleSettings, { teamId });
      if (settings) await this.syncCycleAutomation(teamId, settings);
      where.teamId = teamId;
    } else {
      const settings = await this.em.find(CycleSettings, {
        teamId: { $in: accessibleTeamIds },
      });
      await Promise.all(
        settings.map((teamSettings) =>
          this.syncCycleAutomation(teamSettings.teamId, teamSettings),
        ),
      );
    }

    const cycles = await this.em.find(Cycle, where, {
      orderBy: { number: 'DESC' },
    });

    const capacityByCycle = await this.deriveCapacityByCycle(cycles);

    return Promise.all(
      cycles.map((c) => this.enrichCycle(c, capacityByCycle.get(c.id) ?? 0)),
    );
  }

  async getSettings(teamId: string, memberId: string) {
    await this.assertTeamAccess(teamId, memberId);
    let settings = await this.em.findOne(CycleSettings, { teamId });
    if (!settings) {
      settings = new CycleSettings({ teamId });
      this.em.persist(settings);
      await this.em.flush();
    }
    if (settings.enabled) await this.syncCycleAutomation(teamId, settings);
    return this.serializeSettings(settings);
  }

  async updateSettings(teamId: string, dto: UpdateCycleSettingsDto, memberId: string) {
    await this.assertTeamAccess(teamId, memberId);
    let settings = await this.em.findOne(CycleSettings, { teamId });
    const isNew = !settings;
    if (!settings) settings = new CycleSettings({ teamId });

    const next = {
      enabled: dto.enabled ?? settings.enabled,
      durationWeeks: dto.durationWeeks ?? settings.durationWeeks,
      startDayOfWeek: dto.startDayOfWeek ?? settings.startDayOfWeek,
      timeZone: dto.timeZone ?? settings.timeZone,
      cooldownDays: dto.cooldownDays ?? settings.cooldownDays,
      upcomingCycleCount: dto.upcomingCycleCount ?? settings.upcomingCycleCount,
      autoAddActiveIssues: dto.autoAddActiveIssues ?? settings.autoAddActiveIssues,
    };
    const validationError = getCycleSettingsValidationError(next);
    if (validationError) throw new BadRequestException(validationError);

    if (settings.enabled && !next.enabled) {
      const existingCycles = await this.em.find(Cycle, {
        teamId,
      });
      const todayStart = calendarDateInTimeZone(new Date(), next.timeZone);
      for (const cycle of existingCycles) {
        if (cycle.status === 'upcoming' || cycle.status === 'planned') {
          cycle.deletedAt = new Date();
        } else if (cycle.startDate <= todayStart && cycle.endDate >= todayStart) {
          cycle.status = 'completed';
        }
      }
    }
    Object.assign(settings, next);
    if (isNew) this.em.persist(settings);
    await this.em.flush();
    if (settings.enabled) await this.syncCycleAutomation(teamId, settings);
    return this.serializeSettings(settings);
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
    const teamCycles = await this.em.find(Cycle, { teamId: cycle.teamId });
    const capacityByCycle = await this.deriveCapacityByCycle(teamCycles);
    return this.enrichCycle(cycle, capacityByCycle.get(cycle.id) ?? 0);
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
      // Capacity is derived from persisted cycle scope and team velocity.
      capacity: 0,
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
