export interface CycleProgressIssue {
  statusCategory: string;
}

export function deriveCycleProgress(issues: CycleProgressIssue[]) {
  const scope = issues.length;
  const completed = issues.filter((issue) => issue.statusCategory === 'completed').length;
  const started = issues.filter((issue) => issue.statusCategory === 'started').length;
  return {
    scope,
    started,
    completed,
    successRate: scope > 0 ? Math.round((completed / scope) * 100) : 0,
  };
}
