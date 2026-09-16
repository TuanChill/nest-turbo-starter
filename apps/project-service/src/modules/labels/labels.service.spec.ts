import type { EntityManager } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { Label, Team } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  IssueLabel: class IssueLabel {},
  Label: class MockLabel {},
  LabelGroup: class LabelGroup {},
  ProjectLabel: class ProjectLabel {},
  Team: class MockTeam {},
  Workspace: class Workspace {},
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
});
