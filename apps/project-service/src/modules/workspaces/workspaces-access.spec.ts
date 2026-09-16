import type { EntityManager } from '@mikro-orm/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { Member, Team, TeamMember, Workspace, WorkspaceMember } from '../../data-access';

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

  it('does not expose the invite code to a regular workspace member', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
        if (entity === Workspace && where.$or) {
          return {
            id: 'workspace-1',
            name: 'Workspace',
            slug: 'workspace',
            inviteCode: 'CIR-SECRET',
            ownerId: 'owner-1',
          };
        }
        if (entity === Member && where.$or) {
          return { id: 'member-1', email: 'member@example.com' };
        }
        return null;
      }),
      find: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
        if (entity === WorkspaceMember && where.workspaceId === 'workspace-1') {
          return [{ memberId: 'member-1', role: 'Member' }];
        }
        return [];
      }),
    } as unknown as EntityManager;
    const service = new WorkspacesService(em);

    const result = await service.findOne('workspace', 'member-1');
    expect(result).toMatchObject({
      id: 'workspace-1',
      role: 'Member',
    });
    expect(result.inviteCode).toBeUndefined();
  });

  it('rejects invite-code regeneration by a regular workspace member', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
        if (entity === Workspace && where.$or) {
          return { id: 'workspace-1', ownerId: 'owner-1', inviteCode: 'CIR-OLD' };
        }
        if (entity === WorkspaceMember) {
          return { workspaceId: 'workspace-1', memberId: 'member-1', role: 'Member' };
        }
        return null;
      }),
      find: jest.fn().mockResolvedValue([]),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const service = new WorkspacesService(em);

    await expect(
      service.regenerateInviteCode('workspace-1', 'member-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(em.flush).not.toHaveBeenCalled();
  });
});
