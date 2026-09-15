import type { View } from '@/services/views.service';

interface IssueLike {
   status: { id: string; category: string };
   labels: Array<{ id: string }>;
   priority: { id: string };
   project?: { id: string } | null;
   assignee?: { id: string } | null;
}

interface ProjectLike {
   status: { category: string };
   priority: { id: string };
}

export function filterIssuesForView<T extends IssueLike>(
   view: View,
   source: T[],
   currentUserId?: string
): T[] {
   const filter = view.filter || {};
   return source.filter((issue) => {
      if (
         filter.statusCategories?.length &&
         !filter.statusCategories.includes(issue.status.category)
      )
         return false;
      if (filter.statusIds?.length && !filter.statusIds.includes(issue.status.id)) return false;
      if (
         filter.labelIds?.length &&
         !issue.labels.some((label) => filter.labelIds!.includes(label.id))
      )
         return false;
      if (filter.priorityIds?.length && !filter.priorityIds.includes(issue.priority.id))
         return false;
      if (filter.hasProject && !issue.project) return false;
      if (filter.unassigned && issue.assignee) return false;
      if (filter.assigneeId === 'me' && issue.assignee?.id !== currentUserId) return false;
      return true;
   });
}

export function filterProjectsForView<T extends ProjectLike>(view: View, source: T[]): T[] {
   const filter = view.filter || {};
   return source.filter((project) => {
      if (
         filter.statusCategories?.length &&
         !filter.statusCategories.includes(project.status.category)
      )
         return false;
      if (filter.priorityIds?.length && !filter.priorityIds.includes(project.priority.id))
         return false;
      return true;
   });
}
