import type { EntityManager } from '@mikro-orm/core';
import { CyclesService } from './cycles.service';
import { Cycle, CycleHistory, CycleSettings, Issue, TeamMember } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockCycle {
    [key: string]: unknown;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockCycleHistory {
    [key: string]: unknown;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockCycleSettings {}
  class MockIssue {
    [key: string]: unknown;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockTeamMember {}

  return {
    Cycle: MockCycle,
    CycleHistory: MockCycleHistory,
    CycleSettings: MockCycleSettings,
    Issue: MockIssue,
    TeamMember: MockTeamMember,
  };
});

describe('CyclesService capacity integration', () => {
  it('derives upcoming capacity from prior completed cycle scope', async () => {
    const previous = new Cycle({
      id: 'cycle-previous',
      teamId: 'team-a',
      status: 'completed',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-14T00:00:00.000Z'),
    });
    const upcoming = new Cycle({
      id: 'cycle-upcoming',
      teamId: 'team-a',
      status: 'upcoming',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-09-14T00:00:00.000Z'),
    });
    const issues = [
      ...Array.from(
        { length: 4 },
        (_, index) =>
          new Issue({
            id: `previous-${index}`,
            cycleId: previous.id,
            teamId: 'team-a',
            statusCategory: 'completed',
          }),
      ),
      ...Array.from(
        { length: 3 },
        (_, index) =>
          new Issue({
            id: `upcoming-${index}`,
            cycleId: upcoming.id,
            teamId: 'team-a',
            statusCategory: 'unstarted',
          }),
      ),
    ];
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === CycleSettings || entity === CycleHistory) return null;
        return null;
      }),
      find: jest.fn(async (entity: unknown, where?: Record<string, any>) => {
        if (entity === Cycle) return [previous, upcoming];
        if (entity === TeamMember) return [{ teamId: 'team-a' }, { teamId: 'team-a' }];
        if (entity === CycleHistory) return [];
        if (entity === Issue) {
          if (typeof where?.cycleId === 'string') {
            return issues.filter((issue) => issue.cycleId === where.cycleId);
          }
          return issues;
        }
        return [];
      }),
      persist: jest.fn(),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const service = new CyclesService(em, {
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-a']),
    } as never);

    const result = await service.findAll('member-a', 'team-a');

    expect(result.find((cycle) => cycle.id === 'cycle-upcoming')).toMatchObject({
      scope: 3,
      capacity: 75,
    });
  });
});
