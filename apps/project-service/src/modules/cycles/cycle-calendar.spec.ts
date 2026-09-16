import {
  buildCycleCalendarFeed,
  createCalendarToken,
  decryptCalendarToken,
  hashCalendarToken,
} from './cycle-calendar';
import type { Cycle } from '../../data-access';

describe('cycle calendar feed', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'cycle-calendar-test-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('encrypts and hashes a high-entropy token without exposing the plaintext', () => {
    const token = createCalendarToken();

    expect(token.token).toHaveLength(43);
    expect(token.tokenHash).toBe(hashCalendarToken(token.token));
    expect(token.tokenCiphertext).not.toContain(token.token);
    expect(decryptCalendarToken(token.tokenCiphertext)).toBe(token.token);
  });

  it('renders persisted cycle dates as valid all-day calendar events', () => {
    const cycle: Cycle = {
      id: 'cycle-1',
      teamId: 'team-a',
      name: 'Planning, sprint',
      status: 'current',
      startDate: new Date('2026-09-16T00:00:00.000Z'),
      endDate: new Date('2026-09-29T00:00:00.000Z'),
      scope: 4,
      completed: 1,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-15T00:00:00.000Z'),
    } as Cycle;

    const feed = buildCycleCalendarFeed(
      'Engineering, Platform',
      [cycle],
      new Date('2026-09-16T12:34:56.000Z'),
    );

    expect(feed).toContain('BEGIN:VCALENDAR\r\n');
    expect(feed).toContain('X-WR-CALNAME:Circle · Engineering\\, Platform Cycles');
    expect(feed).toContain('DTSTART;VALUE=DATE:20260916');
    expect(feed).toContain('DTEND;VALUE=DATE:20260930');
    expect(feed).toContain('SUMMARY:Engineering\\, Platform · Planning\\, sprint');
    expect(feed).toContain('DESCRIPTION:Status: current\\nScope: 4\\nCompleted: 1');
    expect(feed.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
