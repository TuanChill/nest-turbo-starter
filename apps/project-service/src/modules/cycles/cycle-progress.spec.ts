import { deriveCycleProgress } from './cycle-progress';

describe('deriveCycleProgress', () => {
  it('counts persisted issue status categories', () => {
    expect(
      deriveCycleProgress([
        { statusCategory: 'completed' },
        { statusCategory: 'started' },
        { statusCategory: 'unstarted' },
      ]),
    ).toEqual({ scope: 3, started: 1, completed: 1, successRate: 33 });
  });

  it('does not use stored seed counters for an empty cycle', () => {
    expect(deriveCycleProgress([])).toEqual({
      scope: 0,
      started: 0,
      completed: 0,
      successRate: 0,
    });
  });
});
