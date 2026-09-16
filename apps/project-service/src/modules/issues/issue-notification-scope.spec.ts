import type { EntityManager } from '@mikro-orm/core';
import { IssuesService } from './issues.service';
import { IssueSubscription, Team, TeamMember, WorkspaceMember } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  IssueSubscription: class MockIssueSubscription {},
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
});
