import { selectIssueNotificationRecipients } from './notification-recipients';

describe('selectIssueNotificationRecipients', () => {
  it('deduplicates subscriptions, excludes the actor, and keeps team scope', () => {
    expect(
      selectIssueNotificationRecipients(
        new Set(['member-1', 'member-2']),
        [
          { memberId: 'member-1' },
          { memberId: 'member-1' },
          { memberId: 'member-2' },
          { memberId: 'member-other-workspace' },
        ],
        'member-1',
      ),
    ).toEqual(['member-2']);
  });

  it('returns no recipients when the only subscription belongs to the actor', () => {
    expect(
      selectIssueNotificationRecipients(
        new Set(['member-1']),
        [{ memberId: 'member-1' }],
        'member-1',
      ),
    ).toEqual([]);
  });
});
