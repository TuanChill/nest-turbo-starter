import { BadRequestException } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { ProjectMilestone } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class EntityManager {},
}));

jest.mock('../../data-access', () => ({
  ProjectMilestone: class ProjectMilestone {
    projectId?: string;
    name?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
}));

jest.mock('../workspaces/workspaces.service', () => ({
  WorkspacesService: class WorkspacesService {},
}));

describe('IssuesService milestone scope', () => {
  const em = { findOne: jest.fn() };
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
});
