import type { EntityManager } from '@mikro-orm/core';
import { ProjectsService } from './projects.service';
import {
  Issue,
  Label,
  Member,
  Project,
  ProjectLabel,
  ProjectMember,
  ProjectSubscription,
  ProjectTeam,
  Team,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockProject {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockTeam {}
  return {
    Initiative: class MockInitiative {},
    Issue: class MockIssue {},
    Label: class MockLabel {},
    LabelGroup: class MockLabelGroup {},
    Member: class MockMember {},
    Project: MockProject,
    ProjectActivity: class MockProjectActivity {},
    ProjectLabel: class MockProjectLabel {},
    ProjectMember: class MockProjectMember {},
    ProjectMilestone: class MockProjectMilestone {},
    ProjectSubscription: class MockProjectSubscription {},
    ProjectTeam: class MockProjectTeam {},
    ProjectUpdate: class MockProjectUpdate {},
    Team: MockTeam,
    Workspace: class MockWorkspace {},
    WorkspaceMember: class MockWorkspaceMember {},
    toSafeMember: (member: unknown) => member,
  };
});

describe('ProjectsService project detail', () => {
  it('does not synthesize a summary when the persisted project has none', async () => {
    const project = new Project({
      id: 'project-1',
      name: 'Roadmap',
      teamId: 'team-1',
      description: [],
      resources: [],
    });
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Team) return { id: 'team-1', workspaceId: 'workspace-1' };
        return null;
      }),
      find: jest.fn(async () => []),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-1']),
    };
    const service = new ProjectsService(em, workspacesService as never);
    jest.spyOn(service, 'findOne').mockResolvedValue(project as never);

    const detail = await service.findDetail(project.id, 'member-1');

    expect(detail.summary).toBe('');
    expect(detail.summary).not.toContain('Project Roadmap');
  });

  it('does not return labels owned by another team or workspace', async () => {
    const project = new Project({
      id: 'project-1',
      name: 'Roadmap',
      teamId: 'team-1',
      description: [],
      resources: [],
    });
    const team = { id: 'team-1', workspaceId: 'workspace-1' };
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Project) return project;
        if (entity === ProjectSubscription) return null;
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === ProjectTeam) return [];
        if (entity === Team) return [team];
        if (entity === ProjectLabel)
          return [
            { projectId: 'project-1', labelId: 'workspace-label' },
            { projectId: 'project-1', labelId: 'foreign-team-label' },
            { projectId: 'project-1', labelId: 'foreign-workspace-label' },
          ];
        if (entity === ProjectMember || entity === Issue || entity === WorkspaceMember)
          return [];
        if (entity === Member) return [];
        if (entity === Label)
          return [
            { id: 'workspace-label', workspaceId: 'workspace-1', teamId: null },
            { id: 'foreign-team-label', workspaceId: 'workspace-1', teamId: 'team-2' },
            { id: 'foreign-workspace-label', workspaceId: 'workspace-2', teamId: null },
          ];
        return [];
      }),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-1']),
    };
    const service = new ProjectsService(em, workspacesService as never);

    const detail = await service.findOne(project.id, 'member-1');

    expect(detail.labels.map((label: { id: string }) => label.id)).toEqual([
      'workspace-label',
    ]);
  });
});
