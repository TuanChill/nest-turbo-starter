import type { EntityManager } from '@mikro-orm/core';
import { IssueTemplatesService } from './issue-templates.service';
import {
  Issue,
  IssueTemplate,
  Project,
  ProjectMilestone,
  Team,
  TeamMember,
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
  class MockProjectMilestone {}
  class MockTeam {}
  class MockTeamMember {}
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
    ProjectMilestone: MockProjectMilestone,
    Team: MockTeam,
    TeamMember: MockTeamMember,
    Workspace: MockWorkspace,
    WorkspaceMember: MockWorkspaceMember,
  };
});

describe('IssueTemplatesService parent defaults', () => {
  function buildService(
    parentTeamId: string,
    access: {
      memberId: string;
      workspaceOwnerId: string;
      workspaceRole?: string;
      teamRole?: string;
    } = {
      memberId: 'member-1',
      workspaceOwnerId: 'member-1',
      workspaceRole: 'Owner',
      teamRole: 'member',
    },
    hasTeamMembership = true,
  ) {
    const em = {
      findOne: jest.fn(async (entity: unknown, where?: Record<string, unknown>) => {
        if (entity === Workspace)
          return {
            id: 'workspace-1',
            slug: 'workspace',
            ownerId: access.workspaceOwnerId,
          };
        if (entity === WorkspaceMember) {
          if (where?.memberId !== access.memberId) return null;
          return {
            workspaceId: 'workspace-1',
            memberId: access.memberId,
            role: access.workspaceRole,
          };
        }
        if (entity === TeamMember) {
          if (where?.memberId !== access.memberId || !hasTeamMembership) return null;
          return {
            teamId: parentTeamId,
            memberId: access.memberId,
            role: access.teamRole,
          };
        }
        if (entity === Issue)
          return { id: 'issue-1', identifier: 'ENG-1', teamId: parentTeamId };
        if (entity === IssueTemplate) return null;
        if (entity === Project) return { id: 'project-1', teamId: parentTeamId };
        if (entity === ProjectMilestone) return null;
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

  it('blocks a regular workspace member from creating a workspace template', async () => {
    const { service, em } = buildService('team-a', {
      memberId: 'member-2',
      workspaceOwnerId: 'owner-1',
      workspaceRole: 'Member',
      teamRole: 'member',
    });

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Workspace template',
          scope: 'workspace',
          config: {},
        },
        'member-2',
      ),
    ).rejects.toThrow('Workspace workspace-1 not found');
    expect(em.persist).not.toHaveBeenCalled();
  });

  it('allows a team lead to create a team template', async () => {
    const { service, em } = buildService('team-a', {
      memberId: 'member-2',
      workspaceOwnerId: 'owner-1',
      workspaceRole: 'Member',
      teamRole: 'lead',
    });

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Team template',
          scope: 'team',
          teamId: 'team-a',
          config: {},
        },
        'member-2',
      ),
    ).resolves.toEqual(expect.objectContaining({ teamId: 'team-a' }));
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

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
          config: { parentIssueId: 'ENG-1' },
        },
        'member-1',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        teamId: 'team-a',
        config: { parentIssueId: 'ENG-1' },
      }),
    );
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('rejects a free-text milestone without a configured project', async () => {
    const { service, em } = buildService('team-a');

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Engineering template',
          scope: 'team',
          teamId: 'team-a',
          config: { milestone: 'Legacy free-text milestone' },
        },
        'member-1',
      ),
    ).rejects.toThrow('requires a configured project');
    expect(em.persist).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('rejects a team-template assignee outside the configured team', async () => {
    const { service, em } = buildService('team-a', undefined, false);

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Engineering template',
          scope: 'team',
          teamId: 'team-a',
          config: { assigneeId: 'member-1' },
        },
        'member-1',
      ),
    ).rejects.toThrow('not a member of the target team');
    expect(em.persist).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
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

  it('rejects a milestone that is not part of the configured project', async () => {
    const { service, em } = buildService('team-a');

    await expect(
      service.create(
        {
          workspaceId: 'workspace-1',
          name: 'Engineering template',
          scope: 'team',
          teamId: 'team-a',
          config: { projectId: 'project-1', milestone: 'Missing' },
        },
        'member-1',
      ),
    ).rejects.toThrow('does not belong to the selected project');
    expect(em.persist).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });
});
