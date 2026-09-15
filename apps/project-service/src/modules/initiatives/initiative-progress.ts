export interface InitiativeProgressProject {
  id: string;
  initiativeId?: string;
  statusCategory: string;
  percentComplete: number;
}

export function deriveInitiativeProgress(
  initiativeId: string,
  projects: InitiativeProgressProject[],
  linkedProjectIds: string[] = [],
) {
  const linked = projects.filter(
    (project) =>
      project.initiativeId === initiativeId || linkedProjectIds.includes(project.id),
  );
  const completed = linked.filter(
    (project) => project.statusCategory === 'completed' || project.percentComplete >= 100,
  ).length;

  return {
    projectCount: linked.length,
    completedProjectCount: completed,
    progressPercent:
      linked.length > 0 ? Math.round((completed / linked.length) * 100) : 0,
  };
}
