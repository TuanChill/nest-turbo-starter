import type { EntityManager } from '@mikro-orm/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CyclesService } from './cycles.service';
import { Cycle, CycleSettings } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  CycleHistory: class MockCycleHistory {},
  Cycle: class MockCycle {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  CycleSettings: class MockCycleSettings {
    teamId = '';
    enabled = false;
    durationWeeks = 2;
    startDayOfWeek = 1;
    cooldownDays = 0;
    upcomingCycleCount = 3;
    autoAddActiveIssues = false;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  Issue: class MockIssue {},
}));

jest.mock('../workspaces/workspaces.service', () => ({
  WorkspacesService: class WorkspacesService {},
}));

describe('CyclesService settings', () => {
  function createService(initialSettings?: InstanceType<typeof CycleSettings>) {
    let settings = initialSettings;
    const persisted: unknown[] = [];
    const upcoming = [
      {
        id: 'existing-upcoming',
        teamId: 'team-a',
        status: 'upcoming',
        deletedAt: undefined,
      },
    ];
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === CycleSettings) return settings ?? null;
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === Cycle && initialSettings?.enabled) return upcoming;
        return [];
      }),
      persist: jest.fn((value: unknown) => {
        persisted.push(value);
        if (value instanceof CycleSettings) settings = value;
      }),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-a']),
    };

    return {
      service: new CyclesService(em, workspacesService as never),
      em,
      persisted,
      upcoming,
    };
  }

  it('rejects invalid cadence before persisting settings', async () => {
    const { service, em, persisted } = createService();

    await expect(
      service.updateSettings(
        'team-a',
        {
          durationWeeks: 9,
        },
        'member-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(persisted).toHaveLength(0);
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('provisions only the requested team cadence after a valid update', async () => {
    const { service, persisted } = createService();

    const result = await service.updateSettings(
      'team-a',
      {
        enabled: true,
        durationWeeks: 1,
        startDayOfWeek: 1,
        cooldownDays: 2,
        upcomingCycleCount: 2,
      },
      'member-1',
    );

    expect(result).toMatchObject({
      teamId: 'team-a',
      enabled: true,
      durationWeeks: 1,
      cooldownDays: 2,
      upcomingCycleCount: 2,
    });
    const createdCycles = persisted.filter((value) => value instanceof Cycle) as Cycle[];
    expect(createdCycles).toHaveLength(2);
    expect(createdCycles.every((cycle) => cycle.teamId === 'team-a')).toBe(true);
    expect(createdCycles[0].startDate).toBeInstanceOf(Date);
    expect(createdCycles[0].endDate).toBeInstanceOf(Date);
  });

  it('soft-deletes upcoming cycles when cadence is disabled', async () => {
    const current = new CycleSettings({ teamId: 'team-a', enabled: true });
    const { service, upcoming } = createService(current);

    await service.updateSettings('team-a', { enabled: false }, 'member-1');

    expect(upcoming[0].deletedAt).toBeInstanceOf(Date);
  });

  it('hides settings for an inaccessible team', async () => {
    const { service, em } = createService();

    await expect(service.getSettings('team-b', 'member-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(em.findOne).not.toHaveBeenCalled();
  });
});
