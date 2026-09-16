import type { EntityManager } from '@mikro-orm/core';
import { IssuesService } from './issues.service';
import {
  IssueSubscription,
  Notification,
  Team,
  TeamMember,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  IssueSubscription: class MockIssueSubscription {},
  Notification: class MockNotification {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  Team: class MockTeam {},
  TeamMember: class MockTeamMember {},
  WorkspaceMember: class MockWorkspaceMember {},
}));

describe('IssuesService notification scope', () => {
  it('does not notify an unsubscribed creator or assignee', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Team) return { id: 'team-1', workspaceId: 'workspace-1' };
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === TeamMember) return [{ memberId: 'member-subscriber' }];
        if (entity === WorkspaceMember) return [];
        if (entity === IssueSubscription) {
          return [{ memberId: 'member-subscriber' }];
        }
        return [];
      }),
    } as unknown as EntityManager;
    const service = new IssuesService(em, {} as never);

    await expect(
      (
        service as unknown as {
          resolveRecipients: (issue: unknown, actorId: string) => Promise<string[]>;
        }
      ).resolveRecipients(
        {
          teamId: 'team-1',
          creatorId: 'member-creator',
          assigneeId: 'member-assignee',
          identifier: 'ENG-1',
        },
        'member-actor',
      ),
    ).resolves.toEqual(['member-subscriber']);
  });

  it('reopens snoozed inbox items before persisting new issue activity notifications', async () => {
    const persisted: unknown[] = [];
    const em = {
      nativeUpdate: jest.fn(async () => 2),
      persist: jest.fn((entity: unknown) => persisted.push(entity)),
    } as unknown as EntityManager;
    const service = new IssuesService(em, {} as never);

    await (
      service as unknown as {
        notifyMany: (
          issueIdentifier: string,
          actorId: string,
          recipientIds: Iterable<string>,
          type: string,
          content: string,
        ) => Promise<void>;
      }
    ).notifyMany(
      'ENG-1',
      'actor-1',
      ['member-1', 'member-1', 'actor-1', 'member-2'],
      'comment',
      'A new comment was added',
    );

    expect(em.nativeUpdate).toHaveBeenCalledWith(
      Notification,
      { issueIdentifier: 'ENG-1', userId: { $in: ['member-1', 'member-2'] } },
      { snoozedUntil: null },
    );
    expect(persisted).toHaveLength(2);
  });
});
