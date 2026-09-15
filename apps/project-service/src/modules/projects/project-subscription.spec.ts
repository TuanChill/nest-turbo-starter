import type { EntityManager } from '@mikro-orm/core';
import { ProjectsService } from './projects.service';
import { Project, ProjectSubscription, ProjectTeam } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockProject {}
  class MockProjectTeam {}
  class MockProjectSubscription {
    projectId?: string;
    memberId?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  return {
    Project: MockProject,
    ProjectTeam: MockProjectTeam,
    ProjectSubscription: MockProjectSubscription,
  };
});

describe('ProjectsService subscriptions', () => {
  function buildService(subscription: ProjectSubscription | null = null) {
    const project = { id: 'project-1', teamId: 'team-1' };
    let currentSubscription = subscription;
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Project) return project;
        if (entity === ProjectSubscription) return currentSubscription;
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === ProjectTeam) return [];
        return [];
      }),
      persist: jest.fn((value: ProjectSubscription) => {
        currentSubscription = value;
      }),
      remove: jest.fn(),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn(async () => ['team-1']),
    };
    const service = new ProjectsService(em, workspacesService as never);
    return { em, service };
  }

  it('creates an idempotent subscription for an accessible project', async () => {
    const { em, service } = buildService();

    await expect(service.subscribe('project-1', 'member-1')).resolves.toEqual({
      projectId: 'project-1',
      subscribed: true,
    });
    await expect(service.subscribe('project-1', 'member-1')).resolves.toEqual({
      projectId: 'project-1',
      subscribed: true,
    });

    expect(em.persist).toHaveBeenCalledTimes(1);
    expect(em.persist).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-1', memberId: 'member-1' }),
    );
  });

  it('does not reveal subscription state for an inaccessible project', async () => {
    const { service } = buildService();
    const workspaceService = (
      service as unknown as { workspacesService: { getAccessibleTeamIds: jest.Mock } }
    ).workspacesService;
    workspaceService.getAccessibleTeamIds.mockResolvedValueOnce([]);

    await expect(service.getSubscription('project-1', 'member-2')).rejects.toThrow(
      'Project project-1 not found',
    );
  });

  it('removes only the authenticated member subscription', async () => {
    const subscription = new ProjectSubscription({
      projectId: 'project-1',
      memberId: 'member-1',
    });
    const { em, service } = buildService(subscription);

    await expect(service.unsubscribe('project-1', 'member-1')).resolves.toEqual({
      projectId: 'project-1',
      subscribed: false,
    });
    expect(em.remove).toHaveBeenCalledWith(subscription);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });
});
