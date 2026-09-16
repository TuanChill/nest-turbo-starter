import { isLabelAvailableForTeam } from './label-scope';

describe('isLabelAvailableForTeam', () => {
  it('allows workspace labels for every team', () => {
    expect(isLabelAvailableForTeam(undefined, 'team-a')).toBe(true);
  });

  it('allows a team label only for its owning team', () => {
    expect(isLabelAvailableForTeam('team-a', 'team-a')).toBe(true);
    expect(isLabelAvailableForTeam('team-a', 'team-b')).toBe(false);
    expect(isLabelAvailableForTeam('team-a', undefined)).toBe(false);
  });
});
