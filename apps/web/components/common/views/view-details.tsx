'use client';

import { GroupedIssuesView } from '@/components/common/issues/grouped-issues-view';
import { InsightsPanel } from '@/components/common/issues/insights-panel';
import ProjectsList from '@/components/common/projects/projects-list';
import { ProjectGroup } from '@/components/common/projects/projects';
import { status as allStatus } from '@/mock-data/status';
import { filterIssuesForView, filterProjectsForView, View } from '@/mock-data/views';
import { useAuthStore } from '@/store/auth-store';
import { useRightPanelStore } from '@/store/right-panel-store';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

function ViewSkeleton() {
   return (
      <div className="w-full h-full flex flex-col overflow-hidden p-6 space-y-4 animate-in fade-in-50 duration-200">
         <div className="flex items-center gap-3">
            <Skeleton className="size-6 rounded" />
            <Skeleton className="h-6 w-48" />
         </div>
         <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
               </div>
            ))}
         </div>
      </div>
   );
}

function IssueViewBody({ view }: { view: View }) {
   const { openPanel } = useRightPanelStore();
   const { data: allIssues = [] } = useIssues();
   const currentUserId = useAuthStore((s) => s.user?.id);
   const issues = useMemo(
      () => filterIssuesForView(view, allIssues, currentUserId),
      [view, allIssues, currentUserId]
   );

   return (
      <div className="w-full h-full flex flex-col overflow-hidden">
         <div className="flex-1 min-h-0 w-full flex overflow-hidden">
            <div className="flex-1 min-w-0 h-full overflow-hidden">
               <GroupedIssuesView
                  issues={issues}
                  totalIssues={issues}
                  statuses={allStatus}
                  isViewTypeGrid={view.layout === 'grid'}
                  emptyStateTitle="No issues match this view"
                  emptyStateSubtitle="Try adjusting the view's filters or create a new issue."
                  emptyStateDescription="Issues matching this view's filters will show up here."
               />
            </div>
            {openPanel === 'insights' && (
               <aside className="hidden lg:flex w-[420px] shrink-0 border-l h-full overflow-hidden bg-container">
                  <InsightsPanel issues={issues} />
               </aside>
            )}
         </div>
      </div>
   );
}

function ProjectViewBody({ view }: { view: View }) {
   const { data: allProjects = [] } = useProjects();
   const groups = useMemo<ProjectGroup[]>(() => {
      const projects = filterProjectsForView(view, allProjects);
      const byStatus = new Map<string, ProjectGroup>();
      for (const project of projects) {
         const key = project.status.id;
         if (!byStatus.has(key)) {
            byStatus.set(key, { id: key, name: project.status.name, projects: [] });
         }
         byStatus.get(key)!.projects.push(project);
      }
      return [...byStatus.values()];
   }, [view, allProjects]);

   return <ProjectsList groups={groups} />;
}

import { useIssues } from '@/hooks/queries/use-issues-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { useView } from '@/hooks/queries/use-views-query';

/** Saved-view detail page: filtered issues (with insights) or projects. */
export default function ViewDetails({ viewId }: { viewId: string }) {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: view, isLoading } = useView(viewId);

   if (isLoading) {
      return <ViewSkeleton />;
   }

   if (!view) {
      return (
         <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground animate-in fade-in-50 duration-200">
            <p className="text-base font-medium text-foreground">View not found</p>
            <p className="text-xs text-muted-foreground">
               This saved view does not exist or has been deleted.
            </p>
            <Link
               href={`/${orgId ?? 'lndev-ui'}/views`}
               className="mt-2 text-xs px-3 py-1.5 rounded-md border border-border/80 bg-accent hover:bg-accent/80 transition-colors font-medium text-foreground"
            >
               Back to views
            </Link>
         </div>
      );
   }

   return view.type === 'issue' ? <IssueViewBody view={view} /> : <ProjectViewBody view={view} />;
}
