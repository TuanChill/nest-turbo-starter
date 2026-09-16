import type { EntityManager } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { Team, TeamMember, Workspace, WorkspaceMember } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({ EntityManager: class MockEntityManager {} }));
jest.mock('uuid', () => ({ v4: () => 'workspace-membership-id' }));

jest.mock('../../data-access', () => {
  class MockMember {}
  class MockTeam {}
  class MockTeamMember {}
  class MockWorkspace {}
  class MockWorkspaceMember {}
  return {
    Member: MockMember,
    Team: MockTeam,
    TeamMember: MockTeamMember,
    Workspace: MockWorkspace,
    WorkspaceMember: MockWorkspaceMember,
  };
});

describe('WorkspacesService access graph', () => {
  it('only exposes workspace-backed teams and ignores orphaned team memberships', async () => {
    const em = {
      find: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
        if (entity === WorkspaceMember && where.memberId === 'member-1') {
          return [{ workspaceId: 'workspace-1' }];
        }
        if (entity === TeamMember && where.memberId === 'member-1') {
          return [{ teamId: 'team-1' }, { teamId: 'orphan-team' }];
        }
        if (entity === Workspace && where.ownerId === 'member-1') return [];
        if (entity === Workspace && where.id) return [{ id: 'workspace-1' }];
        if (entity === Team && where.id) {
          return [
            { id: 'team-1', workspaceId: 'workspace-1' },
            { id: 'orphan-team', workspaceId: undefined },
          ];
        }
        if (entity === Team && where.workspaceId) {
          return [{ id: 'team-1', workspaceId: 'workspace-1' }];
        }
        return [];
      }),
    } as unknown as EntityManager;
    const service = new WorkspacesService(em);

    await expect(service.getAccessibleTeamIds('member-1')).resolves.toEqual(['team-1']);
  });

  it('rejects a workspace name that cannot produce a real slug instead of generating a random one', async () => {
    const em = {
      findOne: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const service = new WorkspacesService(em);

    await expect(service.create({ name: '你好' }, 'member-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(em.findOne).not.toHaveBeenCalled();
    expect(em.persist).not.toHaveBeenCalled();
  });
});
