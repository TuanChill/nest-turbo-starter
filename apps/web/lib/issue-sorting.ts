import type { Issue } from '@/mock-data/issues';

const PRIORITY_ORDER: Record<string, number> = {
   'urgent': 0,
   'high': 1,
   'medium': 2,
   'low': 3,
   'no-priority': 4,
};

export function sortIssuesByPriority(issues: Issue[]): Issue[] {
   return [...issues].sort(
      (a, b) => (PRIORITY_ORDER[a.priority.id] ?? 99) - (PRIORITY_ORDER[b.priority.id] ?? 99)
   );
}
