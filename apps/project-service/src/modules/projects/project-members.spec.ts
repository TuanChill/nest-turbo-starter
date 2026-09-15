import type { EntityManager } from '@mikro-orm/core';
import { ProjectsService } from './projects.service';
import {
  Member,
  Project,
  ProjectMember,
  ProjectTeam,
  Team,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockProject {}
  class MockProjectMember {
    projectId?: string;
    memberId?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockProjectTeam {}
  class MockTeam {}
  class MockWorkspaceMember {}
  class MockMember {}

  return {
    Member: MockMember,
    Project: MockProject,
    ProjectMember: MockProjectMember,
    ProjectTeam: MockProjectTeam,
    Team: MockTeam,
    WorkspaceMember: MockWorkspaceMember,
    toSafeMember: (member: unknown) => member,
  };
});

describe('ProjectsService member isolation', () => {
  function buildService(workspaceMembers: string[]) {
    const project = { id: 'project-1', teamId: 'team-1' };
    const team = { id: 'team-1', workspaceId: 'workspace-1' };
    const persistedMember = { id: 'member-1', name: 'Member One' };
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Project) return project;
        if (entity === Team) return team;
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === ProjectTeam) return [];
        if (entity === WorkspaceMember) {
          return workspaceMembers.map((memberId) => ({ memberId }));
        }
        if (entity === ProjectMember) return [];
        if (entity === Member) return workspaceMembers.map(() => persistedMember);
        return [];
      }),
      persist: jest.fn(),
      remove: jest.fn(),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-1']),
    };
    const service = new ProjectsService(em, workspacesService as never);
    return { em, service, workspacesService };
  }

  it('accepts only members of the project team workspace', async () => {
    const { em, service } = buildService(['member-1']);

    await expect(
      service.replaceMembers('project-1', ['member-1'], 'member-1'),
    ).resolves.toEqual(expect.any(Array));
    expect(em.persist).toHaveBeenCalledWith([
      expect.objectContaining({ projectId: 'project-1', memberId: 'member-1' }),
    ]);
  });

  it('rejects a member from another workspace before mutating project membership', async () => {
    const { em, service } = buildService([]);

    await expect(
      service.replaceMembers('project-1', ['foreign-member'], 'member-1'),
    ).rejects.toThrow('Project member(s) are not in the team workspace');
    expect(em.persist).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('does not expose project membership through an inaccessible team', async () => {
    const { em, service, workspacesService } = buildService(['member-1']);
    workspacesService.getAccessibleTeamIds.mockResolvedValueOnce([]);

    await expect(service.getMembers('project-1', 'member-2')).rejects.toThrow(
      'Project project-1 not found',
    );
    expect(em.find).not.toHaveBeenCalledWith(ProjectMember, expect.anything());
  });
});
