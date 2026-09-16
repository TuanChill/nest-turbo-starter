import { estimateCycleCapacity } from './cycle-capacity';

describe('estimateCycleCapacity', () => {
  it('uses the average of the three completed cycle scopes', () => {
    expect(estimateCycleCapacity(6, [4, 6, 8, 100], 20)).toBe(100);
    expect(estimateCycleCapacity(3, [4, 6, 8], 20)).toBe(50);
  });

  it('falls back to team size before any cycle has completed', () => {
    expect(estimateCycleCapacity(3, [], 6)).toBe(50);
    expect(estimateCycleCapacity(6, [], 6)).toBe(100);
  });

  it('returns zero when there is no usable baseline or scope', () => {
    expect(estimateCycleCapacity(4, [], 0)).toBe(0);
    expect(estimateCycleCapacity(0, [4, 6, 8], 3)).toBe(0);
  });
});
