import { allocateCycleId, allocateCycleNumber } from './cycle-allocation';

describe('cycle identity allocation', () => {
  it('keeps numbering team-local while avoiding stale client numbers', () => {
    expect(allocateCycleNumber([], 1)).toBe(1);
    expect(allocateCycleNumber([4, 7], 1)).toBe(8);
    expect(allocateCycleNumber([4, 7], 12)).toBe(12);
  });

  it('does not reuse a globally occupied legacy id', () => {
    expect(allocateCycleId('1', true, 'generated-id')).toBe('generated-id');
    expect(allocateCycleId('custom-id', false, 'generated-id')).toBe('custom-id');
    expect(allocateCycleId(undefined, false, 'generated-id')).toBe('generated-id');
  });
});
