import { deriveInitiativeProgress } from './initiative-progress';

describe('deriveInitiativeProgress', () => {
  it('derives counts from linked persisted projects only', () => {
    expect(
      deriveInitiativeProgress('initiative-1', [
        {
          id: 'p1',
          initiativeId: 'initiative-1',
          statusCategory: 'completed',
          percentComplete: 0,
        },
        {
          id: 'p2',
          initiativeId: 'initiative-1',
          statusCategory: 'started',
          percentComplete: 40,
        },
        {
          id: 'p3',
          initiativeId: undefined,
          statusCategory: 'completed',
          percentComplete: 100,
        },
      ]),
    ).toEqual({ projectCount: 2, completedProjectCount: 1, progressPercent: 50 });
  });

  it('does not invent progress for an empty initiative', () => {
    expect(deriveInitiativeProgress('initiative-1', [])).toEqual({
      projectCount: 0,
      completedProjectCount: 0,
      progressPercent: 0,
    });
  });

  it('counts a legacy persisted project id while it is being migrated to the relation', () => {
    expect(
      deriveInitiativeProgress(
        'initiative-1',
        [{ id: 'p1', statusCategory: 'completed', percentComplete: 0 }],
        ['p1'],
      ),
    ).toEqual({ projectCount: 1, completedProjectCount: 1, progressPercent: 100 });
  });
});
