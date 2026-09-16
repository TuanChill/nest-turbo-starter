import type { EntityManager } from '@mikro-orm/core';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LabelsService } from './labels.service';
import {
  Label,
  LabelGroup,
  Team,
  TeamMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  IssueLabel: class IssueLabel {},
  Label: class MockLabel {},
  LabelGroup: class MockLabelGroup {},
  ProjectLabel: class ProjectLabel {},
  Team: class MockTeam {},
  TeamMember: class MockTeamMember {},
  Workspace: class MockWorkspace {},
  WorkspaceMember: class MockWorkspaceMember {},
}));

jest.mock('../workspaces/workspaces.service', () => ({
  WorkspacesService: class WorkspacesService {},
}));

describe('LabelsService team scope', () => {
  it('returns workspace labels and only labels owned by the requested team', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Team) return { id: 'team-a', workspaceId: 'workspace-a' };
        return null;
      }),
      find: jest.fn(async () => []),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleWorkspaceIds: jest.fn(async () => ['workspace-a']),
      getAccessibleTeamIds: jest.fn(async () => ['team-a', 'team-b']),
    };
    const service = new LabelsService(em, workspacesService as never);

    await service.findAll('member-1', 'issue', 'workspace-a', 'team-a');

    expect(em.find).toHaveBeenCalledWith(Label, {
      workspaceId: { $in: ['workspace-a'] },
      scope: { $in: ['issue', 'both'] },
      $or: [{ teamId: null }, { teamId: 'team-a' }],
    });
  });

  it('does not accept a team from another workspace in a label query', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Team) return { id: 'team-b', workspaceId: 'workspace-b' };
        return null;
      }),
      find: jest.fn(async () => []),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleWorkspaceIds: jest.fn(async () => ['workspace-a']),
      getAccessibleTeamIds: jest.fn(async () => ['team-b']),
    };
    const service = new LabelsService(em, workspacesService as never);

    await expect(
      service.findAll('member-1', undefined, 'workspace-a', 'team-b'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(em.find).not.toHaveBeenCalledWith(Label, expect.anything());
  });

  it('rejects workspace-label creation by a regular member', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Workspace) return { id: 'workspace-a', ownerId: 'owner-1' };
        if (entity === WorkspaceMember) {
          return { workspaceId: 'workspace-a', role: 'Member' };
        }
        return null;
      }),
      find: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const service = new LabelsService(em, {
      getAccessibleWorkspaceIds: jest.fn().mockResolvedValue(['workspace-a']),
      getAccessibleTeamIds: jest.fn().mockResolvedValue([]),
    } as never);

    await expect(
      service.create(
        {
          id: 'bug',
          name: 'Bug',
          color: 'red',
          workspaceId: 'workspace-a',
        },
        'member-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(em.persist).not.toHaveBeenCalled();
  });

  it('allows a team lead to create a team-scoped label', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Workspace) return { id: 'workspace-a', ownerId: 'owner-1' };
        if (entity === Team) return { id: 'team-a', workspaceId: 'workspace-a' };
        if (entity === WorkspaceMember) {
          return { workspaceId: 'workspace-a', role: 'Member' };
        }
        if (entity === TeamMember) {
          return { teamId: 'team-a', memberId: 'lead-1', role: 'lead' };
        }
        return null;
      }),
      find: jest.fn().mockResolvedValue([]),
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const service = new LabelsService(em, {
      getAccessibleWorkspaceIds: jest.fn().mockResolvedValue(['workspace-a']),
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-a']),
    } as never);

    await expect(
      service.create(
        {
          id: 'bug',
          name: 'Bug',
          color: 'red',
          workspaceId: 'workspace-a',
          teamId: 'team-a',
        },
        'lead-1',
      ),
    ).resolves.toBeDefined();
    expect(em.persist).toHaveBeenCalledTimes(1);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('rejects Linear-reserved label names', async () => {
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Workspace) return { id: 'workspace-a', ownerId: 'owner-1' };
        if (entity === WorkspaceMember) {
          return { workspaceId: 'workspace-a', role: 'Admin' };
        }
        return null;
      }),
      find: jest.fn().mockResolvedValue([]),
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const service = new LabelsService(em, {
      getAccessibleWorkspaceIds: jest.fn().mockResolvedValue(['workspace-a']),
      getAccessibleTeamIds: jest.fn().mockResolvedValue([]),
    } as never);

    await expect(
      service.create(
        {
          id: 'status-label',
          name: 'Status',
          color: 'red',
          workspaceId: 'workspace-a',
        },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(em.persist).not.toHaveBeenCalled();
  });

  it('rejects adding a label to a full label group', async () => {
    const groupId = '11111111-1111-4111-8111-111111111111';
    const groupedLabels = Array.from({ length: 250 }, (_, index) => ({
      id: `label-${index}`,
      workspaceId: 'workspace-a',
      groupId,
    }));
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Workspace) return { id: 'workspace-a', ownerId: 'owner-1' };
        if (entity === WorkspaceMember) {
          return { workspaceId: 'workspace-a', role: 'Admin' };
        }
        if (entity === LabelGroup) return { id: groupId, workspaceId: 'workspace-a' };
        return null;
      }),
      find: jest.fn(async (entity: unknown, where?: Record<string, unknown>) => {
        if (entity === Label && where?.groupId === groupId) return groupedLabels;
        return [];
      }),
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const service = new LabelsService(em, {
      getAccessibleWorkspaceIds: jest.fn().mockResolvedValue(['workspace-a']),
      getAccessibleTeamIds: jest.fn().mockResolvedValue([]),
    } as never);

    await expect(
      service.create(
        {
          id: 'label-251',
          name: 'Another label',
          color: 'red',
          workspaceId: 'workspace-a',
          groupId,
        },
        'admin-1',
      ),
    ).rejects.toThrow('cannot contain more than 250 labels');
    expect(em.persist).not.toHaveBeenCalled();
  });
});
