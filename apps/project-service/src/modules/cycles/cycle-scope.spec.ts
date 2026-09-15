import { cycleIssueWhere } from './cycle-scope';

describe('cycleIssueWhere', () => {
  it('keeps cycle progress queries inside the cycle team', () => {
    expect(cycleIssueWhere('cycle-1', 'team-1')).toEqual({
      cycleId: 'cycle-1',
      teamId: 'team-1',
    });
  });
});
