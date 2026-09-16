import type { EntityManager } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { hashInvitationToken } from './invitation-token';
import { WorkspacesService } from './workspaces.service';
import {
  Member,
  Team,
  TeamMember,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({ EntityManager: class MockEntityManager {} }));
jest.mock('uuid', () => ({
  v4: () => 'workspace-membership-id',
  v7: () => 'team-membership-id',
}));
jest.mock('../../data-access', () => {
  class MockMember {}
  class MockTeam {}
  class MockTeamMember {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  class MockWorkspace {}
  class MockWorkspaceInvitation {}
  class MockWorkspaceMember {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  return {
    Member: MockMember,
    Team: MockTeam,
    TeamMember: MockTeamMember,
    Workspace: MockWorkspace,
    WorkspaceInvitation: MockWorkspaceInvitation,
    WorkspaceMember: MockWorkspaceMember,
  };
});

describe('WorkspacesService invitations', () => {
  it('does not allow joining a workspace by slug without an invitation or invite code', async () => {
    const em = {
      findOne: jest.fn(),
    } as unknown as EntityManager;
    const service = new WorkspacesService(em);

    await expect(service.join({ slug: 'acme' } as never, 'member-1')).rejects.toThrow(
      'invitation token or workspace invite code',
    );
    expect(em.findOne).not.toHaveBeenCalled();
  });

  it('accepts a matching invitation and applies its scoped team membership', async () => {
    const workspace = {
      id: 'workspace-1',
      name: 'Acme',
      slug: 'acme',
      ownerId: 'owner-1',
      inviteCode: 'CIR-SECRET',
    };
    const invitation = {
      workspaceId: workspace.id,
      email: 'invitee@example.com',
      tokenHash: hashInvitationToken('secret-token'),
      teamIds: ['team-1'],
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: null,
    };
    const persisted: unknown[] = [];
    const em = {
      findOne: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
        if (entity === Member) return { id: 'member-1', email: 'invitee@example.com' };
        if (entity === WorkspaceInvitation) return invitation;
        if (entity === Workspace) return workspace;
        if (entity === WorkspaceMember) return null;
        if (entity === TeamMember && where.teamId === 'team-1') return null;
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === Team) return [{ id: 'team-1', workspaceId: workspace.id }];
        if (entity === WorkspaceMember) return [{ memberId: 'member-1' }];
        return [];
      }),
      persist: jest.fn((entity: unknown) => persisted.push(entity)),
      flush: jest.fn().mockResolvedValue(undefined),
    } as unknown as EntityManager;
    const service = new WorkspacesService(em);

    const result = await service.join({ invitationToken: 'secret-token' }, 'member-1');

    expect(result).toEqual(expect.objectContaining({ id: workspace.id, role: 'Member' }));
    expect(result.inviteCode).toBeUndefined();
    expect(invitation.acceptedAt).toEqual(expect.any(Date));
    expect(persisted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ teamId: 'team-1', memberId: 'member-1' }),
      ]),
    );
  });

  it('rejects an invitation used by a different email address', async () => {
    const invitation = {
      email: 'invitee@example.com',
      tokenHash: hashInvitationToken('secret-token'),
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: null,
    };
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Member) return { id: 'member-1', email: 'other@example.com' };
        if (entity === WorkspaceInvitation) return invitation;
        return null;
      }),
    } as unknown as EntityManager;
    const service = new WorkspacesService(em);

    await expect(
      service.join({ invitationToken: 'secret-token' }, 'member-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
