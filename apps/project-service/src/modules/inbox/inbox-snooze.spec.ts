import type { EntityManager } from '@mikro-orm/core';
import { InboxService } from './inbox.service';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../issues/issues.service', () => ({
  IssuesService: class MockIssuesService {},
}));

jest.mock('../../data-access', () => {
  class MockNotification {
    id?: string;
    userId?: string;
    snoozedUntil?: Date;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  return {
    Issue: class MockIssue {},
    Member: class MockMember {},
    Notification: MockNotification,
    NotificationPreference: class MockNotificationPreference {},
    Team: class MockTeam {},
    TeamMember: class MockTeamMember {},
    WorkspaceMember: class MockWorkspaceMember {},
    toSafeMember: (member: unknown) => member,
  };
});

describe('InboxService notification snooze', () => {
  const { Issue, Member, Notification, Team, TeamMember, WorkspaceMember } =
    jest.requireMock('../../data-access') as Record<string, unknown>;
  const NotificationClass = Notification as new (partial?: Record<string, unknown>) => {
    id?: string;
    userId?: string;
    issueIdentifier?: string;
    actorId?: string;
    createdAt?: Date;
    read?: boolean;
    snoozedUntil?: Date;
  };

  it('persists a future snooze and supports scoped unsnooze', async () => {
    const notification = new NotificationClass({
      id: 'notification-1',
      userId: 'member-1',
    });
    const em = {
      findOne: jest.fn(async (entity: unknown, where: Record<string, unknown>) =>
        entity === Notification &&
        where.id === notification.id &&
        where.userId === 'member-1'
          ? notification
          : null,
      ),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const service = new InboxService(em, {} as never);
    const until = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await expect(
      service.snooze('member-1', notification.id!, { until }),
    ).resolves.toEqual({
      success: true,
      id: notification.id,
      snoozedUntil: until,
    });
    expect(notification.snoozedUntil?.toISOString()).toBe(until);

    await expect(
      service.snooze('member-1', notification.id!, { until: null }),
    ).resolves.toEqual({
      success: true,
      id: notification.id,
      snoozedUntil: null,
    });
    expect(notification.snoozedUntil).toBeUndefined();
    expect(em.flush).toHaveBeenCalledTimes(2);
  });

  it('rejects past snooze times and notifications owned by another member', async () => {
    const notification = new NotificationClass({
      id: 'notification-1',
      userId: 'member-1',
    });
    const em = {
      findOne: jest.fn(async (entity: unknown, where: Record<string, unknown>) =>
        entity === Notification &&
        where.id === notification.id &&
        where.userId === 'member-1'
          ? notification
          : null,
      ),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const service = new InboxService(em, {} as never);

    await expect(
      service.snooze('member-1', notification.id!, {
        until: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      }),
    ).rejects.toThrow('Snooze time must be in the future');
    await expect(
      service.snooze('member-2', notification.id!, {
        until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    ).rejects.toThrow('Notification notification-1 not found');
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('hides future snoozes by default but exposes them when requested', async () => {
    const future = new NotificationClass({
      id: 'future',
      userId: 'member-1',
      issueIdentifier: 'ENG-1',
      actorId: 'actor-1',
      createdAt: new Date(),
      read: false,
      snoozedUntil: new Date(Date.now() + 60 * 60 * 1000),
    });
    const expired = new NotificationClass({
      id: 'expired',
      userId: 'member-1',
      issueIdentifier: 'ENG-1',
      actorId: 'actor-1',
      createdAt: new Date(),
      read: false,
      snoozedUntil: new Date(Date.now() - 60 * 60 * 1000),
    });
    const em = {
      find: jest.fn(async (entity: unknown) =>
        entity === Notification ? [future, expired] : [],
      ),
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Issue) return { identifier: 'ENG-1', teamId: 'team-1' };
        if (entity === Team) return { id: 'team-1', workspaceId: 'workspace-1' };
        if (entity === Member) return { id: 'actor-1', name: 'Actor' };
        if (entity === TeamMember) return { teamId: 'team-1', memberId: 'actor-1' };
        if (entity === WorkspaceMember) return null;
        return null;
      }),
    } as unknown as EntityManager;
    const service = new InboxService(em, {
      findOne: jest.fn(async () => ({ identifier: 'ENG-1', teamId: 'team-1' })),
    } as never);

    await expect(service.findAll('member-1')).resolves.toHaveLength(1);
    await expect(service.findAll('member-1', true)).resolves.toHaveLength(2);
  });
});
