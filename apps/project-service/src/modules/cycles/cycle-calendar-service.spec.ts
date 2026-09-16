import type { EntityManager } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { createCalendarToken } from './cycle-calendar';
import { CyclesService } from './cycles.service';
import { Cycle, CycleCalendarSubscription, Team } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  Cycle: class MockCycle {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  CycleCalendarSubscription: class MockCycleCalendarSubscription {
    createdAt = new Date();

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  CycleHistory: class MockCycleHistory {},
  CycleSettings: class MockCycleSettings {},
  Issue: class MockIssue {},
  Team: class MockTeam {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  TeamMember: class MockTeamMember {},
}));

jest.mock('../workspaces/workspaces.service', () => ({
  WorkspacesService: class WorkspacesService {},
}));

describe('CyclesService calendar subscriptions', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'cycle-calendar-service-test-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  function createService(subscription?: CycleCalendarSubscription) {
    const em = {
      findOne: jest.fn(async (entity: unknown, where?: Record<string, string>) => {
        if (entity === CycleCalendarSubscription && where?.teamId === 'team-a') {
          return subscription ?? null;
        }
        if (entity === CycleCalendarSubscription && where?.tokenHash) {
          return subscription?.tokenHash === where.tokenHash ? subscription : null;
        }
        if (entity === Team && where?.id === 'team-a')
          return { id: 'team-a', name: 'Engineering' };
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === Cycle) {
          return [
            {
              id: 'cycle-1',
              teamId: 'team-a',
              name: 'Cycle 1',
              status: 'current',
              startDate: new Date('2026-09-16T00:00:00.000Z'),
              endDate: new Date('2026-09-29T00:00:00.000Z'),
              scope: 2,
              completed: 0,
              createdAt: new Date('2026-09-01T00:00:00.000Z'),
              updatedAt: new Date('2026-09-15T00:00:00.000Z'),
            },
          ];
        }
        return [];
      }),
      persist: jest.fn(),
      flush: jest.fn(async () => undefined),
      remove: jest.fn(),
    };
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-a']),
    };
    return {
      service: new CyclesService(
        em as unknown as EntityManager,
        workspacesService as never,
      ),
      em,
    };
  }

  it('creates a team-scoped subscription and returns a feed path without the token hash', async () => {
    const { service, em } = createService();

    const result = await service.subscribeCalendar('team-a', 'member-1');

    expect(result).toMatchObject({ teamId: 'team-a', subscribed: true });
    expect(result.feedPath).toMatch(/^\/circle\/api\/cycles\/calendar\/.+\.ics$/);
    expect(result).not.toHaveProperty('tokenHash');
    expect(em.persist).toHaveBeenCalledWith(expect.any(CycleCalendarSubscription));
    const persisted = em.persist.mock.calls[0][0] as CycleCalendarSubscription;
    expect(persisted.tokenHash).toHaveLength(64);
    expect(persisted.tokenCiphertext).toBeTruthy();
  });

  it('returns a tokenized feed using only the matching subscription hash', async () => {
    const tokenData = createCalendarToken();
    const subscription = new CycleCalendarSubscription({
      teamId: 'team-a',
      ...tokenData,
    });
    const { service } = createService(subscription);

    const feed = await service.calendarFeed(tokenData.token);

    expect(feed).toContain('BEGIN:VCALENDAR');
    expect(feed).toContain('SUMMARY:Engineering · Cycle 1');
    await expect(service.calendarFeed('invalid-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('revokes the team feed and prevents access after removal', async () => {
    const tokenData = createCalendarToken();
    const subscription = new CycleCalendarSubscription({
      teamId: 'team-a',
      ...tokenData,
    });
    const { service, em } = createService(subscription);

    await expect(service.unsubscribeCalendar('team-a', 'member-1')).resolves.toEqual({
      teamId: 'team-a',
      subscribed: false,
    });
    expect(em.remove).toHaveBeenCalledWith(subscription);
  });
});
