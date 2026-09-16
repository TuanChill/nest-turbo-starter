import { resolveIssueMilestone } from './issue-milestone-scope';

describe('resolveIssueMilestone', () => {
  it('returns the canonical project milestone name', () => {
    expect(
      resolveIssueMilestone({
        projectId: 'project-1',
        milestone: ' milestone-id ',
        matchingProjectMilestone: { projectId: 'project-1', name: 'Beta' },
      }),
    ).toEqual({ value: 'Beta' });
  });

  it('rejects a milestone without a project', () => {
    expect(resolveIssueMilestone({ milestone: 'Beta' })).toEqual({
      error: 'An issue milestone requires a project',
    });
  });

  it('rejects a milestone owned by another project', () => {
    expect(
      resolveIssueMilestone({
        projectId: 'project-1',
        milestone: 'Beta',
        matchingProjectMilestone: { projectId: 'project-2', name: 'Beta' },
      }),
    ).toEqual({ error: 'Issue milestone must belong to the selected project' });
  });

  it('treats an empty value as clearing the milestone', () => {
    expect(
      resolveIssueMilestone({
        projectId: 'project-1',
        milestone: '  ',
      }),
    ).toEqual({ value: undefined });
  });
});
