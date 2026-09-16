import type { EntityManager } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
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

describe('InitiativesService update reactions', () => {
  const initiative = new Initiative({ id: 'initiative-1', workspaceId: 'workspace-1' });
  const update = new InitiativeUpdate({
    id: 'update-1',
    initiativeId: initiative.id,
    authorId: 'member-2',
    reactions: [{ emoji: '👍', count: 2, userIds: ['member-1', 'member-2'] }],
  });

  function buildService(accessibleWorkspaceIds = ['workspace-1']) {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Initiative) return initiative;
        if (entity === InitiativeUpdate) return update;
        return null;
      }),
      persist: jest.fn(),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleWorkspaceIds: jest.fn(async () => accessibleWorkspaceIds),
    };
    const service = new InitiativesService(em, workspacesService as never);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: initiative.id } as never);
    return { em, service };
  }

  beforeEach(() => {
    update.reactions = [{ emoji: '👍', count: 2, userIds: ['member-1', 'member-2'] }];
  });

  it('adds an authenticated member once and records activity', async () => {
    const { em, service } = buildService();

    await service.addUpdateReaction(initiative.id, update.id, '🚀', 'member-1');
    await service.addUpdateReaction(initiative.id, update.id, '🚀', 'member-1');

    expect(update.reactions).toEqual([
      { emoji: '👍', count: 2, userIds: ['member-1', 'member-2'] },
      { emoji: '🚀', count: 1, userIds: ['member-1'] },
    ]);
    expect(em.persist).toHaveBeenCalledWith(
      expect.objectContaining({
        initiativeId: initiative.id,
        actorId: 'member-1',
        event: 'reacted to initiative update',
      }),
    );
    expect(em.flush).toHaveBeenCalledTimes(2);
  });

  it('removes only the authenticated member reaction', async () => {
    const { service } = buildService();

    await service.removeUpdateReaction(initiative.id, update.id, '👍', 'member-1');

    expect(update.reactions).toEqual([{ emoji: '👍', count: 1, userIds: ['member-2'] }]);
  });

  it('does not mutate reactions outside the initiative workspace', async () => {
    const { em, service } = buildService([]);

    await expect(
      service.removeUpdateReaction(initiative.id, update.id, '👍', 'member-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(em.flush).not.toHaveBeenCalled();
    expect(update.reactions).toEqual([
      { emoji: '👍', count: 2, userIds: ['member-1', 'member-2'] },
    ]);
  });
});
