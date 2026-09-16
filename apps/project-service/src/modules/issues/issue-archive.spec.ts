import type { EntityManager } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { Issue } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  Issue: class MockIssue {},
}));

describe('IssuesService archive and restore', () => {
  function buildService() {
    const em = {
      find: jest.fn(),
      findOne: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-a']),
      getAccessibleWorkspaceIds: jest.fn(),
    };
    return {
      service: new IssuesService(em, workspacesService as never),
      em,
      workspacesService,
    };
  }

  it('lists only deleted issues from teams accessible to the member', async () => {
    const { service, em } = buildService();
    const deletedAt = new Date('2026-09-16T10:00:00.000Z');
    em.find = jest.fn().mockResolvedValue([
      {
        id: 'issue-1',
        identifier: 'ENG-1',
        title: 'Deleted issue',
        teamId: 'team-a',
        statusId: 'done',
        statusCategory: 'completed',
        priorityId: 'medium',
        deletedAt,
        createdAt: new Date('2026-09-01T10:00:00.000Z'),
      },
    ]);

    await expect(service.findArchived('member-1', 'team-a')).resolves.toEqual([
      expect.objectContaining({
        identifier: 'ENG-1',
        deletedAt: deletedAt.toISOString(),
      }),
    ]);
    expect(em.find).toHaveBeenCalledWith(
      Issue,
      { teamId: 'team-a', deletedAt: { $ne: null } },
      expect.objectContaining({ filters: { softDelete: false } }),
    );

    await expect(service.findArchived('member-1', 'team-b')).resolves.toEqual([]);
    expect(em.find).toHaveBeenCalledTimes(1);
  });

  it('restores a deleted issue only after checking team access', async () => {
    const { service, em } = buildService();
    const issue = {
      id: 'issue-1',
      identifier: 'ENG-1',
      teamId: 'team-a',
      deletedAt: new Date('2026-09-16T10:00:00.000Z'),
    };
    em.findOne = jest.fn().mockResolvedValue(issue);
    const restored = { identifier: 'ENG-1', title: 'Restored issue' };
    jest.spyOn(service, 'findOne').mockResolvedValue(restored as never);

    await expect(service.restore('ENG-1', 'member-1')).resolves.toEqual(restored);
    expect(em.findOne).toHaveBeenCalledWith(
      Issue,
      { $or: [{ identifier: 'ENG-1' }, { id: 'ENG-1' }] },
      { filters: { softDelete: false } },
    );
    expect(issue.deletedAt).toBeUndefined();
    expect(em.flush).toHaveBeenCalledTimes(1);
    expect(service.findOne).toHaveBeenCalledWith('ENG-1', 'member-1');
  });

  it('does not restore an issue from another team or an active issue', async () => {
    const { service, em, workspacesService } = buildService();
    em.findOne = jest.fn().mockResolvedValue({
      identifier: 'ENG-1',
      teamId: 'team-b',
      deletedAt: new Date(),
    });

    await expect(service.restore('ENG-1', 'member-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(em.flush).not.toHaveBeenCalled();
    expect(workspacesService.getAccessibleTeamIds).toHaveBeenCalledWith('member-1');

    em.findOne = jest.fn().mockResolvedValue({
      identifier: 'ENG-2',
      teamId: 'team-a',
      deletedAt: undefined,
    });
    await expect(service.restore('ENG-2', 'member-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(em.flush).not.toHaveBeenCalled();
  });
});
