import type { EntityManager } from '@mikro-orm/core';
import { IssueTemplatesService } from './issue-templates.service';
import {
  Issue,
  IssueTemplate,
  Team,
  Workspace,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockCycle {}
  class MockIssue {}
  class MockIssueTemplate {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockLabel {}
  class MockLabelGroup {}
  class MockMember {}
  class MockProject {}
  class MockTeam {}
  class MockWorkspace {}
  class MockWorkspaceMember {}

  return {
    Cycle: MockCycle,
    Issue: MockIssue,
    IssueTemplate: MockIssueTemplate,
    Label: MockLabel,
    LabelGroup: MockLabelGroup,
    Member: MockMember,
    Project: MockProject,
    Team: MockTeam,
    Workspace: MockWorkspace,
    WorkspaceMember: MockWorkspaceMember,
  };
});

describe('IssueTemplatesService parent defaults', () => {
  function buildService(parentTeamId: string) {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Workspace)
          return { id: 'workspace-1', slug: 'workspace', ownerId: 'member-1' };
        if (entity === WorkspaceMember)
          return { workspaceId: 'workspace-1', memberId: 'member-1' };
        if (entity === Issue)
          return { id: 'issue-1', identifier: 'ENG-1', teamId: parentTeamId };
        if (entity === IssueTemplate) return null;
        if (entity === Team) return { id: parentTeamId, workspaceId: 'workspace-1' };
        return null;
      }),
      persist: jest.fn(),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-a', 'team-b']),
    };
    return {
      em,
      service: new IssueTemplatesService(em, workspacesService as never),
    };
  }

  it('rejects a workspace template with a parent issue default', async () => {
    const { service, em } = buildService('team-a');

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Workspace template',
          scope: 'workspace',
          config: { parentIssueId: 'ENG-1' },
        },
        'member-1',
      ),
    ).rejects.toThrow('requires a team template');
    expect(em.persist).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('accepts a parent issue default from the same team', async () => {
    const { service, em } = buildService('team-a');

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Engineering template',
          scope: 'team',
          teamId: 'team-a',
          config: { parentIssueId: 'ENG-1', milestone: 'Beta' },
        },
        'member-1',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        teamId: 'team-a',
        config: { parentIssueId: 'ENG-1', milestone: 'Beta' },
      }),
    );
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('rejects a parent issue from another team', async () => {
    const { service, em } = buildService('team-b');

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Engineering template',
          scope: 'team',
          teamId: 'team-a',
          config: { parentIssueId: 'ENG-1' },
        },
        'member-1',
      ),
    ).rejects.toThrow('requires a team template');
    expect(em.persist).not.toHaveBeenCalled();
  });
});
