import { filterVisibleTeamIds } from './member-scope';

describe('filterVisibleTeamIds', () => {
  it('removes team memberships outside the requester scope', () => {
    expect(
      filterVisibleTeamIds(
        [{ teamId: 'team-a' }, { teamId: 'team-b' }, { teamId: 'team-a' }],
        new Set(['team-a']),
      ),
    ).toEqual(['team-a', 'team-a']);
  });
});
