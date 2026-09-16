import { BadRequestException } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssueLabel, ProjectMilestone } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class EntityManager {},
}));

jest.mock('../../data-access', () => ({
  ProjectMilestone: class MockProjectMilestone {
    projectId?: string;
    name?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  IssueLabel: class MockIssueLabel {
    labelId?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
}));

jest.mock('../workspaces/workspaces.service', () => ({
  WorkspacesService: class WorkspacesService {},
}));

describe('IssuesService milestone scope', () => {
  const em = { findOne: jest.fn(), find: jest.fn() };
  const service = new IssuesService(em as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('resolves an issue milestone by project-scoped id or name', async () => {
    em.findOne.mockResolvedValue(
      new ProjectMilestone({ projectId: 'project-1', name: 'Beta' }),
    );

    await expect(
      (service as any).resolveMilestoneForProject('project-1', 'milestone-1'),
    ).resolves.toBe('Beta');
    expect(em.findOne).toHaveBeenCalledWith(ProjectMilestone, {
      projectId: 'project-1',
      $or: [{ id: 'milestone-1' }, { name: 'milestone-1' }],
    });
  });

  it('rejects a milestone that is not found in the selected project', async () => {
    em.findOne.mockResolvedValue(null);

    await expect(
      (service as any).resolveMilestoneForProject('project-1', 'Missing'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not query the database when clearing a milestone', async () => {
    await expect(
      (service as any).resolveMilestoneForProject('project-1', '  '),
    ).resolves.toBeUndefined();
    expect(em.findOne).not.toHaveBeenCalled();
  });

  it('deduplicates legacy issue-label join rows before team validation', async () => {
    const issue = { id: 'issue-id', identifier: 'ENG-1' };
    em.find.mockResolvedValue([
      { labelId: 'label-a' },
      { labelId: 'label-a' },
      { labelId: 'label-b' },
    ]);

    await expect((service as any).getExistingIssueLabelIds(issue)).resolves.toEqual([
      'label-a',
      'label-b',
    ]);
    expect(em.find).toHaveBeenCalledWith(IssueLabel, {
      $or: [{ issueId: 'issue-id' }, { issueId: 'ENG-1' }],
    });
  });
});
