import type { Issue } from '@/mock-data/issues';

export function groupIssuesByStatus(issues: Issue[]): Record<string, Issue[]> {
   return issues.reduce<Record<string, Issue[]>>((acc, issue) => {
      const statusId = issue.status.id;
      (acc[statusId] ??= []).push(issue);
      return acc;
   }, {});
}
