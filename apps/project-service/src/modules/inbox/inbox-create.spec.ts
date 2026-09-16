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
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  class MockMember {}
  class MockIssue {}
  class MockTeam {}
  class MockTeamMember {}
  class MockWorkspaceMember {}

  return {
    Member: MockMember,
    Issue: MockIssue,
    Notification: MockNotification,
    NotificationPreference: class MockNotificationPreference {},
    Team: MockTeam,
    TeamMember: MockTeamMember,
    WorkspaceMember: MockWorkspaceMember,
    toSafeMember: (member: unknown) => member,
  };
});

describe('InboxService notification creation', () => {
  it('assigns a persisted UUID when the client does not provide an id', async () => {
    const { Member, Notification, Team, TeamMember, WorkspaceMember } = jest.requireMock(
      '../../data-access',
    ) as Record<string, unknown>;
    const persisted: unknown[] = [];
    const em = {
      findOne: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
        if (entity === Member) return { id: where.id };
        if (entity === Team) return { id: 'team-1', workspaceId: 'workspace-1' };
        if (entity === TeamMember) return { teamId: 'team-1', memberId: where.memberId };
        if (entity === WorkspaceMember) return null;
        return null;
      }),
      persist: jest.fn((value: unknown) => persisted.push(value)),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const issuesService = {
      findOne: jest.fn(async () => ({ teamId: 'team-1' })),
    };
    const service = new InboxService(em, issuesService as never);

    const result = await service.create(
      {
        issueIdentifier: 'ENG-1',
        actorId: 'member-1',
        type: 'mention',
        content: 'A persisted notification',
      },
      'member-1',
    );

    expect(result).toBe(persisted[0]);
    expect(result).toBeInstanceOf(Notification as never);
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.id).not.toContain('notification-');
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('surfaces issue hydration failures instead of returning an empty inbox', async () => {
    const { Issue, Notification } = jest.requireMock('../../data-access') as Record<
      string,
      unknown
    >;
    const em = {
      find: jest.fn(async () => [
        {
          id: 'notification-1',
          issueIdentifier: 'ENG-1',
          actorId: 'member-1',
          createdAt: new Date(),
          read: false,
        },
      ]),
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Notification) return null;
        if (entity === Issue) return { identifier: 'ENG-1' };
        return null;
      }),
    } as unknown as EntityManager;
    const service = new InboxService(em, {
      findOne: jest.fn(async () => {
        throw new Error('issue lookup failed');
      }),
    } as never);

    await expect(service.findAll('member-1')).rejects.toThrow('issue lookup failed');
  });
});
