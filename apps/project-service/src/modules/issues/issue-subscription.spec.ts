import type { EntityManager } from '@mikro-orm/core';
import { IssuesService } from './issues.service';
import { Issue, IssueSubscription } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockIssue {}
  class MockIssueSubscription {
    issueIdentifier?: string;
    memberId?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  return { Issue: MockIssue, IssueSubscription: MockIssueSubscription };
});

describe('IssuesService subscriptions', () => {
  function buildService(subscription: IssueSubscription | null = null) {
    const issue = { id: 'issue-1', identifier: 'ENG-1', teamId: 'team-1' };
    let currentSubscription = subscription;
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Issue) return issue;
        if (entity === IssueSubscription) return currentSubscription;
        return null;
      }),
      persist: jest.fn((value: IssueSubscription) => {
        currentSubscription = value;
      }),
      remove: jest.fn(),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-1']),
    };
    const service = new IssuesService(em, workspacesService as never);
    return { em, service, issue };
  }

  it('creates an idempotent subscription for an accessible issue', async () => {
    const { em, service } = buildService();

    await expect(service.subscribe('ENG-1', 'member-1')).resolves.toEqual({
      identifier: 'ENG-1',
      subscribed: true,
    });
    await expect(service.subscribe('ENG-1', 'member-1')).resolves.toEqual({
      identifier: 'ENG-1',
      subscribed: true,
    });

    expect(em.persist).toHaveBeenCalledTimes(1);
    expect(em.persist).toHaveBeenCalledWith(
      expect.objectContaining({ issueIdentifier: 'ENG-1', memberId: 'member-1' }),
    );
  });

  it('does not reveal subscription state for an inaccessible team', async () => {
    const { service } = buildService();
    const workspaceService = (
      service as unknown as { workspacesService: { getAccessibleTeamIds: jest.Mock } }
    ).workspacesService;
    workspaceService.getAccessibleTeamIds.mockResolvedValueOnce([]);

    await expect(service.getSubscription('ENG-1', 'member-2')).rejects.toThrow(
      'Issue ENG-1 not found',
    );
  });

  it('removes only the authenticated member subscription', async () => {
    const subscription = new IssueSubscription({
      issueIdentifier: 'ENG-1',
      memberId: 'member-1',
    });
    const { em, service } = buildService(subscription);

    await expect(service.unsubscribe('ENG-1', 'member-1')).resolves.toEqual({
      identifier: 'ENG-1',
      subscribed: false,
    });
    expect(em.remove).toHaveBeenCalledWith(subscription);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });
});
