import type { EntityManager } from '@mikro-orm/core';
import { ProjectTemplatesService } from './project-templates.service';
import { ProjectTemplate, Team, Workspace, WorkspaceMember } from '../../data-access';
import type { ProjectTemplateConfig } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../issues/issues.service', () => ({
  IssuesService: class MockIssuesService {},
}));

jest.mock('../projects/projects.service', () => ({
  ProjectsService: class MockProjectsService {},
}));

jest.mock('../workspaces/workspaces.service', () => ({
  WorkspacesService: class MockWorkspacesService {},
}));

jest.mock('../../data-access', () => {
  class MockProjectTemplate {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockTeam {}
  class MockWorkspace {}
  class MockWorkspaceMember {}
  class MockInitiative {}
  class MockLabel {}
  class MockLabelGroup {}
  class MockProjectMember {}
  return {
    Initiative: MockInitiative,
    Label: MockLabel,
    LabelGroup: MockLabelGroup,
    ProjectMember: MockProjectMember,
    ProjectTemplate: MockProjectTemplate,
    Team: MockTeam,
    Workspace: MockWorkspace,
    WorkspaceMember: MockWorkspaceMember,
  };
});

describe('ProjectTemplatesService.instantiate', () => {
  function buildService(
    issuesService: { create: jest.Mock; addRelation?: jest.Mock },
    config: ProjectTemplateConfig = {
      issues: [
        { key: 'root', title: 'Root issue' },
        { key: 'child', title: 'Child issue', parentKey: 'root' },
      ],
    },
  ) {
    let rolledBack = false;
    const template = new ProjectTemplate({
      id: 'template-1',
      workspaceId: 'workspace-1',
      name: 'Launch',
      scope: 'workspace',
      createdBy: 'member-1',
      config,
    });
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === ProjectTemplate) return template;
        if (entity === Workspace)
          return { id: 'workspace-1', slug: 'workspace', ownerId: 'member-1' };
        if (entity === WorkspaceMember)
          return { workspaceId: 'workspace-1', memberId: 'member-1' };
        if (entity === Team) return { id: 'team-1', workspaceId: 'workspace-1' };
        return null;
      }),
      find: jest.fn(async () => []),
      persist: jest.fn(),
      transactional: jest.fn(async (callback: () => Promise<unknown>) => {
        try {
          return await callback();
        } catch (error) {
          rolledBack = true;
          throw error;
        }
      }),
    } as unknown as EntityManager;
    const projectsService = {
      create: jest.fn(async () => ({ id: 'project-1' })),
      findOne: jest.fn(async () => ({ milestones: [] })),
      addMilestone: jest.fn(async () => ({
        milestones: [{ id: 'milestone-1', name: 'Kickoff' }],
      })),
    };
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-1']),
    };

    const service = new ProjectTemplatesService(
      em,
      workspacesService as never,
      projectsService as never,
      issuesService as never,
    );

    return { service, em, projectsService, rolledBack: () => rolledBack };
  }

  it('remaps parent references to newly created issue IDs', async () => {
    const issuesService = {
      create: jest
        .fn()
        .mockResolvedValueOnce({ id: 'issue-root' })
        .mockResolvedValueOnce({ id: 'issue-child' }),
    };
    const { service, projectsService } = buildService(issuesService);

    await service.instantiate(
      'template-1',
      { name: 'Launch copy', teamId: 'team-1' },
      'member-1',
    );

    expect(issuesService.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ parentIssueId: 'issue-root', projectId: 'project-1' }),
      'member-1',
    );
    expect(projectsService.findOne).toHaveBeenCalledWith('project-1', 'member-1');
  });

  it('remaps cloned issue milestones to the new milestone name', async () => {
    const issuesService = { create: jest.fn().mockResolvedValue({ id: 'issue-1' }) };
    const { service, projectsService } = buildService(issuesService, {
      milestones: [{ key: 'kickoff', name: 'Kickoff' }],
      issues: [{ key: 'root', title: 'Root issue', milestoneKey: 'kickoff' }],
    });
    projectsService.findOne.mockResolvedValue({
      milestones: [{ id: 'milestone-1', name: 'Kickoff' }],
    });

    await service.instantiate(
      'template-1',
      { name: 'Launch copy', teamId: 'team-1' },
      'member-1',
    );

    expect(issuesService.create).toHaveBeenCalledWith(
      expect.objectContaining({ milestone: 'Kickoff' }),
      'member-1',
    );
  });

  it('keeps the transaction failure visible so all cloned records can roll back', async () => {
    const issuesService = {
      create: jest
        .fn()
        .mockResolvedValueOnce({ id: 'issue-root' })
        .mockRejectedValueOnce(new Error('invalid cloned issue')),
    };
    const { service, em, projectsService, rolledBack } = buildService(issuesService);

    await expect(
      service.instantiate(
        'template-1',
        { name: 'Broken copy', teamId: 'team-1' },
        'member-1',
      ),
    ).rejects.toThrow('invalid cloned issue');

    expect(em.transactional).toHaveBeenCalledTimes(1);
    expect(rolledBack()).toBe(true);
    expect(projectsService.findOne).not.toHaveBeenCalled();
  });

  it('remaps template issue relations to the newly created identifiers', async () => {
    const issuesService = {
      create: jest
        .fn()
        .mockResolvedValueOnce({ id: 'issue-root', identifier: 'ENG-101' })
        .mockResolvedValueOnce({ id: 'issue-other', identifier: 'ENG-102' }),
      addRelation: jest.fn().mockResolvedValue({}),
    };
    const { service } = buildService(issuesService, {
      issues: [
        { key: 'root', title: 'Root issue' },
        { key: 'other', title: 'Other issue' },
      ],
      relations: [{ sourceKey: 'root', targetKey: 'other', relationType: 'blocks' }],
    });

    await service.instantiate(
      'template-1',
      { name: 'Launch copy', teamId: 'team-1' },
      'member-1',
    );

    expect(issuesService.addRelation).toHaveBeenCalledWith(
      'ENG-101',
      { targetIdentifier: 'ENG-102', relationType: 'blocks' },
      'member-1',
    );
  });

  it('rejects relations that reference an issue outside the template', async () => {
    const issuesService = {
      create: jest.fn(),
      addRelation: jest.fn(),
    };
    const { service } = buildService(issuesService, {
      issues: [{ key: 'root', title: 'Root issue' }],
      relations: [
        { sourceKey: 'root', targetKey: 'missing', relationType: 'relates_to' },
      ],
    });

    await expect(
      service.instantiate(
        'template-1',
        { name: 'Invalid copy', teamId: 'team-1' },
        'member-1',
      ),
    ).rejects.toThrow('Template contains invalid references');
    expect(issuesService.create).not.toHaveBeenCalled();
  });
});
