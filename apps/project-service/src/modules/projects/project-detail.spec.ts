import type { EntityManager } from '@mikro-orm/core';
import { ProjectsService } from './projects.service';
import { Project, Team } from '../../data-access';

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
});
