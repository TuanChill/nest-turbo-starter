'use client';

import type { Issue } from '@/mock-data/issues';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

export const MY_ISSUES_TABS = ['assigned', 'created', 'subscribed', 'activity'] as const;
export type MyIssuesTab = (typeof MY_ISSUES_TABS)[number];

export const MY_ISSUES_TAB_ITEMS: { label: string; value: MyIssuesTab }[] = [
   { label: 'Assigned', value: 'assigned' },
   { label: 'Created', value: 'created' },
   { label: 'Subscribed', value: 'subscribed' },
   { label: 'Activity', value: 'activity' },
];

/** Shared tab state (URL-backed) between the header and the page body. */
export function useMyIssuesTab() {
   return useQueryState('tab', parseAsStringLiteral(MY_ISSUES_TABS).withDefault('assigned'));
}

const isCreatedByMe = (issue: Issue, currentUserId: string): boolean => {
   return issue.creatorId === currentUserId;
};

const isSubscribed = (issue: Issue, currentUserId: string): boolean =>
   issue.assignee?.id === currentUserId || isCreatedByMe(issue, currentUserId);

/** Issues shown by each My issues tab. */
export function scopeMyIssues(
   issues: Issue[],
   tab: MyIssuesTab,
   currentUserId: string | null
): Issue[] {
   if (!currentUserId) return [];

   switch (tab) {
      case 'assigned':
         return issues.filter((issue) => issue.assignee?.id === currentUserId);
      case 'created':
         return issues.filter((issue) => isCreatedByMe(issue, currentUserId));
      case 'subscribed':
         return issues.filter((issue) => isSubscribed(issue, currentUserId));
      case 'activity':
      default:
         // "Activity" = everything I touch, most recent first.
         return issues
            .filter((issue) => isSubscribed(issue, currentUserId))
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
   }
}
