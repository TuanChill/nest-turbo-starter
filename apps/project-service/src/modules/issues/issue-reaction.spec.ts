import type { EntityManager } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { Issue, IssueActivity } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockIssueActivity {
    id?: string;
    issueIdentifier?: string;
    reactions?: unknown[];

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  class MockIssue {
    identifier?: string;
    teamId?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  return { Issue: MockIssue, IssueActivity: MockIssueActivity };
});

describe('IssuesService reactions', () => {
  function buildService(activity: IssueActivity, accessibleTeamIds = ['team-1']) {
    const issue = new Issue({ identifier: 'ENG-1', teamId: 'team-1' });
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === IssueActivity) return activity;
        if (entity === Issue) return issue;
        return null;
      }),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => accessibleTeamIds),
    };
    return {
      em,
      service: new IssuesService(em, workspacesService as never),
    };
  }

  it('removes only the authenticated member from a reaction', async () => {
    const activity = new IssueActivity({
      id: 'activity-1',
      issueIdentifier: 'ENG-1',
      reactions: [{ emoji: '👍', count: 2, userIds: ['member-1', 'member-2'] }],
    });
    const { em, service } = buildService(activity);

    await service.removeReaction('activity-1', '👍', 'member-1');

    expect(activity.reactions).toEqual([
      { emoji: '👍', count: 1, userIds: ['member-2'] },
    ]);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('removes the reaction record when the last member toggles it off', async () => {
    const activity = new IssueActivity({
      id: 'activity-1',
      issueIdentifier: 'ENG-1',
      reactions: [{ emoji: '👍', count: 1, userIds: ['member-1'] }],
    });
    const { service } = buildService(activity);

    await service.removeReaction('activity-1', '👍', 'member-1');

    expect(activity.reactions).toEqual([]);
  });

  it('does not mutate reactions for an inaccessible issue team', async () => {
    const activity = new IssueActivity({
      id: 'activity-1',
      issueIdentifier: 'ENG-1',
      reactions: [{ emoji: '👍', count: 1, userIds: ['member-1'] }],
    });
    const { em, service } = buildService(activity, []);

    await expect(service.removeReaction('activity-1', '👍', 'member-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(em.flush).not.toHaveBeenCalled();
    expect(activity.reactions).toEqual([
      { emoji: '👍', count: 1, userIds: ['member-1'] },
    ]);
  });
});
