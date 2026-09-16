import type { EntityManager } from '@mikro-orm/core';
import { ProjectsService } from './projects.service';
import { Project, ProjectTeam, ProjectUpdate } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockProject {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockProjectUpdate {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockProjectTeam {}

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
    ProjectTeam: MockProjectTeam,
    ProjectUpdate: MockProjectUpdate,
    Team: class MockTeam {},
    Workspace: class MockWorkspace {},
    WorkspaceMember: class MockWorkspaceMember {},
    toSafeMember: (member: unknown) => member,
  };
});

describe('ProjectsService update mutations', () => {
  const memberId = 'member-1';
  const otherMemberId = 'member-2';
  const project = new Project({
    id: 'project-1',
    teamId: 'team-1',
    healthId: 'on-track',
  });

  function buildService(
    latestUpdate: ProjectUpdate,
    previousUpdates: ProjectUpdate[] = [],
  ) {
    const em = {
      findOne: jest.fn(
        async (entity: unknown, where: Record<string, unknown>, options?: unknown) => {
          if (entity === Project) return project;
          if (entity === ProjectUpdate && 'id' in where) return latestUpdate;
          if (entity === ProjectUpdate && options) return latestUpdate;
          return null;
        },
      ),
      find: jest.fn(async (entity: unknown) => {
        if (entity === ProjectTeam) return [];
        if (entity === ProjectUpdate) return previousUpdates;
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
    jest
      .spyOn(service, 'findDetail')
      .mockResolvedValue({ projectId: project.id } as never);
    return { em, service };
  }

  it('allows the author to edit a project update and updates project health', async () => {
    const update = new ProjectUpdate({
      id: 'update-1',
      projectId: project.id,
      authorId: memberId,
      health: 'on-track',
      blocks: [{ type: 'paragraph', text: 'Old update' }],
    });
    const { em, service } = buildService(update);

    await expect(
      service.updateUpdate(
        project.id,
        update.id,
        { health: 'at-risk', blocks: [{ type: 'paragraph', text: 'New update' }] },
        memberId,
      ),
    ).resolves.toEqual({ projectId: project.id });

    expect(update.health).toBe('at-risk');
    expect(update.blocks).toEqual([{ type: 'paragraph', text: 'New update' }]);
    expect(project.healthId).toBe('at-risk');
    expect(em.flush).toHaveBeenCalled();
  });

  it('rejects a project update mutation by a different member', async () => {
    const update = new ProjectUpdate({
      id: 'update-2',
      projectId: project.id,
      authorId: memberId,
      health: 'on-track',
      blocks: [],
    });
    const { em, service } = buildService(update);

    await expect(
      service.updateUpdate(project.id, update.id, { health: 'off-track' }, otherMemberId),
    ).rejects.toThrow('Only the update author can change this project update');

    expect(em.flush).not.toHaveBeenCalled();
  });

  it('deletes the latest update and restores the previous project health', async () => {
    const update = new ProjectUpdate({
      id: 'update-3',
      projectId: project.id,
      authorId: memberId,
      health: 'off-track',
      blocks: [],
    });
    const previous = new ProjectUpdate({
      id: 'update-previous',
      projectId: project.id,
      authorId: otherMemberId,
      health: 'on-track',
      blocks: [],
    });
    const { em, service } = buildService(update, [previous]);

    await expect(service.deleteUpdate(project.id, update.id, memberId)).resolves.toEqual({
      projectId: project.id,
    });

    expect(em.remove).toHaveBeenCalledWith(update);
    expect(project.healthId).toBe('on-track');
    expect(em.flush).toHaveBeenCalled();
  });
});
