export interface IssueNotificationSubscription {
  memberId: string;
}

/**
 * Issue notifications are driven by the member's issue subscription. The
 * caller supplies the already-authorized team/workspace member set so stale or
 * cross-workspace subscriptions cannot become a notification leak.
 */
export function selectIssueNotificationRecipients(
  allowedMemberIds: ReadonlySet<string>,
  subscriptions: readonly IssueNotificationSubscription[],
  excludeActorId: string,
): string[] {
  const recipients = new Set<string>();
  for (const subscription of subscriptions) {
    const memberId = subscription.memberId;
    if (memberId && memberId !== excludeActorId && allowedMemberIds.has(memberId)) {
      recipients.add(memberId);
    }
  }
  return [...recipients];
}
