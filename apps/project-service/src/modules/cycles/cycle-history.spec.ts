import { calculateIdealProgress, mergeCycleBurnup } from './cycle-history';

describe('cycle history', () => {
  it('calculates the ideal line between the cycle dates', () => {
    expect(
      calculateIdealProgress(
        new Date('2026-09-01T00:00:00.000Z'),
        new Date('2026-09-11T00:00:00.000Z'),
        new Date('2026-09-06T00:00:00.000Z'),
        20,
      ),
    ).toBe(10);
    expect(
      calculateIdealProgress(
        new Date('2026-09-01T00:00:00.000Z'),
        new Date('2026-09-11T00:00:00.000Z'),
        new Date('2026-08-31T00:00:00.000Z'),
        20,
      ),
    ).toBe(0);
  });

  it('replaces a legacy point when a persisted snapshot has the same day', () => {
    expect(
      mergeCycleBurnup(
        [{ date: '2026-09-05', scope: 2, started: 1, completed: 0, ideal: 1 }],
        [
          { date: '2026-09-05', scope: 3, started: 2, completed: 1, ideal: 1.5 },
          { date: '2026-09-06', scope: 3, started: 2, completed: 1, ideal: 1.8 },
        ],
      ),
    ).toEqual([
      { date: '2026-09-05', scope: 3, started: 2, completed: 1, ideal: 1.5 },
      { date: '2026-09-06', scope: 3, started: 2, completed: 1, ideal: 1.8 },
    ]);
  });
});
