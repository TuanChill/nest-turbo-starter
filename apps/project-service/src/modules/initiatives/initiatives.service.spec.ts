import type { EntityManager } from '@mikro-orm/core';
import { InitiativesService } from './initiatives.service';
import { Initiative, InitiativeUpdate } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => {
  class MockInitiative {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockInitiativeActivity {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockInitiativeUpdate {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  return {
    Initiative: MockInitiative,
    InitiativeActivity: MockInitiativeActivity,
    InitiativeUpdate: MockInitiativeUpdate,
    Label: class MockLabel {},
    LabelGroup: class MockLabelGroup {},
    Member: class MockMember {},
    Project: class MockProject {},
    ProjectTeam: class MockProjectTeam {},
    Team: class MockTeam {},
    Workspace: class MockWorkspace {},
    WorkspaceMember: class MockWorkspaceMember {},
    toSafeMember: (member: unknown) => member,
  };
});

describe('InitiativesService update mutations', () => {
  const memberId = 'member-1';
  const otherMemberId = 'member-2';
  const initiative = new Initiative({
    id: 'initiative-1',
    workspaceId: 'workspace-1',
    name: 'Platform',
    healthId: 'on-track',
    projectIds: [],
    labelIds: [],
    resources: [],
  });

  function buildService(
    latestUpdate: InitiativeUpdate,
    previousUpdates: InitiativeUpdate[] = [],
  ) {
    const em = {
      findOne: jest.fn(
        async (entity: unknown, where: Record<string, unknown>, options?: unknown) => {
          if (entity === Initiative) return initiative;
          if (entity === InitiativeUpdate && 'id' in where) return latestUpdate;
          if (entity === InitiativeUpdate && options) return latestUpdate;
          return null;
        },
      ),
      find: jest.fn(async (entity: unknown) =>
        entity === InitiativeUpdate ? previousUpdates : [],
      ),
      persist: jest.fn(),
      remove: jest.fn(),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleWorkspaceIds: jest.fn(async () => ['workspace-1']),
    };
    const service = new InitiativesService(em, workspacesService as never);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: initiative.id } as never);
    return { em, service };
  }

  it('allows the author to edit an initiative update and keeps latest health aligned', async () => {
    const update = new InitiativeUpdate({
      id: 'update-1',
      initiativeId: initiative.id,
      authorId: memberId,
      health: 'on-track',
      blocks: [{ type: 'paragraph', text: 'Old update' }],
    });
    const { em, service } = buildService(update);

    await expect(
      service.updateUpdate(
        initiative.id,
        update.id,
        { health: 'at-risk', blocks: [{ type: 'paragraph', text: 'New update' }] },
        memberId,
      ),
    ).resolves.toEqual({ id: initiative.id });

    expect(update.health).toBe('at-risk');
    expect(update.blocks).toEqual([{ type: 'paragraph', text: 'New update' }]);
    expect(em.persist).toHaveBeenCalledWith(
      expect.objectContaining({
        initiativeId: initiative.id,
        actorId: memberId,
        event: 'updated initiative update',
      }),
    );
    expect(initiative.healthId).toBe('at-risk');
    expect(em.flush).toHaveBeenCalled();
  });

  it('rejects edits by a different member without mutating the update', async () => {
    const update = new InitiativeUpdate({
      id: 'update-2',
      initiativeId: initiative.id,
      authorId: memberId,
      health: 'on-track',
      blocks: [],
    });
    const { em, service } = buildService(update);

    await expect(
      service.updateUpdate(
        initiative.id,
        update.id,
        { health: 'off-track' },
        otherMemberId,
      ),
    ).rejects.toThrow('Only the update author can change this initiative update');

    expect(update.health).toBe('on-track');
    expect(em.persist).not.toHaveBeenCalled();
    expect(em.remove).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('deletes the latest authored update and restores the previous health', async () => {
    const update = new InitiativeUpdate({
      id: 'update-3',
      initiativeId: initiative.id,
      authorId: memberId,
      health: 'off-track',
      blocks: [],
    });
    const previous = new InitiativeUpdate({
      id: 'update-previous',
      initiativeId: initiative.id,
      authorId: otherMemberId,
      health: 'on-track',
      blocks: [],
    });
    const { em, service } = buildService(update, [previous]);

    await expect(
      service.deleteUpdate(initiative.id, update.id, memberId),
    ).resolves.toEqual({
      id: initiative.id,
    });

    expect(em.remove).toHaveBeenCalledWith(update);
    expect(initiative.healthId).toBe('on-track');
    expect(em.persist).toHaveBeenCalledWith(
      expect.objectContaining({
        initiativeId: initiative.id,
        actorId: memberId,
        event: 'deleted initiative update',
      }),
    );
    expect(em.flush).toHaveBeenCalled();
  });
});
