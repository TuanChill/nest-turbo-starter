import type { EntityManager } from '@mikro-orm/core';
import { IssuesService } from './issues.service';
import {
  Issue,
  IssueLabel,
  Label,
  Project,
  ProjectTeam,
  Team,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockIssue {
    [key: string]: unknown;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockIssueLabel {}
  class MockLabel {}
  class MockProject {}
  class MockProjectTeam {}
  class MockTeam {}
  class MockWorkspaceMember {}

  return {
    Issue: MockIssue,
    IssueLabel: MockIssueLabel,
    Label: MockLabel,
    Project: MockProject,
    ProjectTeam: MockProjectTeam,
    Team: MockTeam,
    WorkspaceMember: MockWorkspaceMember,
  };
});

describe('IssuesService facets', () => {
  it('returns counts only for visible issue references', async () => {
    const issues = [
      new Issue({
        id: 'issue-1',
        identifier: 'ENG-1',
        teamId: 'team-a',
        statusId: 'in-progress',
        statusCategory: 'started',
        priorityId: 'high',
        assigneeId: 'member-a',
        projectId: 'project-a',
        cycleId: 'cycle-a',
      }),
      new Issue({
        id: 'issue-2',
        identifier: 'ENG-2',
        teamId: 'team-a',
        statusId: 'backlog',
        statusCategory: 'backlog',
        priorityId: 'no-priority',
      }),
    ];
    const em = {
      find: jest.fn().mockImplementation(async (entity: unknown) => {
        if (entity === Issue) return issues;
        if (entity === IssueLabel) {
          return [
            { issueId: 'issue-1', labelId: 'label-a' },
            { issueId: 'issue-1', labelId: 'foreign-label' },
          ];
        }
        if (entity === Team) return [{ id: 'team-a', workspaceId: 'workspace-a' }];
        if (entity === Label) return [{ id: 'label-a', workspaceId: 'workspace-a' }];
        if (entity === WorkspaceMember) return [{ memberId: 'member-a' }];
        if (entity === Project) return [{ id: 'project-a', teamId: 'team-a' }];
        if (entity === ProjectTeam) return [];
        return [];
      }),
    };
    const workspacesService = {
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-a']),
    };
    const service = new IssuesService(
      em as unknown as EntityManager,
      workspacesService as never,
    );

    await expect(service.findFacets('member-a')).resolves.toEqual({
      status: { 'in-progress': 1, backlog: 1 },
      statusType: { started: 1, backlog: 1 },
      priority: { high: 1, 'no-priority': 1 },
      assignee: { 'member-a': 1, unassigned: 1 },
      labels: { 'label-a': 1 },
      project: { 'project-a': 1, 'no-project': 1 },
      cycle: { 'cycle-a': 1, 'no-cycle': 1 },
    });
  });

  it('returns an empty result for a team outside the authenticated scope', async () => {
    const em = { find: jest.fn() };
    const workspacesService = {
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-a']),
    };
    const service = new IssuesService(
      em as unknown as EntityManager,
      workspacesService as never,
    );

    await expect(service.findFacets('member-a', { teamId: 'team-b' })).resolves.toEqual({
      status: {},
      statusType: {},
      priority: {},
      assignee: {},
      labels: {},
      project: {},
      cycle: {},
    });
    expect(em.find).not.toHaveBeenCalled();
  });
});
