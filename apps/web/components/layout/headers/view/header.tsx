'use client';

import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CreateViewDialog } from '@/components/common/views/create-view-dialog';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { applyIssueFilters } from '@/components/common/issues/issue-filter-columns';
import { filterIssuesForView, filterProjectsForView } from '@/lib/view-filters';
import { useIssues } from '@/hooks/queries/use-issues-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { useDeleteView, useViews } from '@/hooks/queries/use-views-query';
import type { CustomViewFilter } from '@/services/views.service';
import { useAuthStore } from '@/store/auth-store';
import { useRightPanelStore } from '@/store/right-panel-store';
import { BarChart3, MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import QueryErrorState from '@/components/common/query-error-state';

export default function Header() {
   const { orgId, viewId } = useParams<{ orgId: string; viewId: string }>();
   const router = useRouter();
   const { data: views = [], error: viewsError, refetch: refetchViews } = useViews();
   const view = views.find((v) => v.id === viewId);
   const { openPanel, togglePanel } = useRightPanelStore();
   const viewFilter = view?.filter as CustomViewFilter | undefined;
   const {
      data: allIssues = [],
      error: issuesError,
      refetch: refetchIssues,
   } = useIssues({
      teamId: view?.teamId,
      projectId: view?.projectId,
      advancedFilters:
         Array.isArray(viewFilter?.filters) && viewFilter.filters.length > 0
            ? JSON.stringify(viewFilter.filters)
            : undefined,
   });
   const {
      data: allProjects = [],
      error: projectsError,
      refetch: refetchProjects,
   } = useProjects(view?.teamId);
   const currentUserId = useAuthStore((s) => s.user?.id);
   const deleteViewMutation = useDeleteView();

   const [editOpen, setEditOpen] = useState(false);
   const [deleteOpen, setDeleteOpen] = useState(false);

   if (viewsError) {
      return (
         <QueryErrorState
            subject="saved view"
            error={viewsError}
            onRetry={() => refetchViews()}
            compact
         />
      );
   }
   if (issuesError) {
      return (
         <QueryErrorState
            subject="view issues"
            error={issuesError}
            onRetry={() => refetchIssues()}
            compact
         />
      );
   }
   if (projectsError) {
      return (
         <QueryErrorState
            subject="view projects"
            error={projectsError}
            onRetry={() => refetchProjects()}
            compact
         />
      );
   }
   if (!view) return null;

   const count = (() => {
      if (view.type === 'issue') {
         const scoped = filterIssuesForView(view, allIssues, currentUserId);
         return Array.isArray(viewFilter?.filters)
            ? applyIssueFilters(scoped, viewFilter.filters).length
            : scoped.length;
      }
      return filterProjectsForView(view, allProjects).length;
   })();

   const handleDelete = async () => {
      await deleteViewMutation.mutateAsync(view.id);
      setDeleteOpen(false);
      router.push(`/${orgId}/views`);
   };

   return (
      <div className="w-full flex flex-col">
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
            <div className="flex items-center gap-2 min-w-0">
               <SidebarTrigger />
               <span className="inline-flex size-5 items-center justify-center rounded bg-muted/50 text-xs shrink-0">
                  {view.icon}
               </span>
               <span className="text-sm font-medium truncate">{view.name}</span>
               <Star className="size-3.5 text-muted-foreground shrink-0 ml-1" />
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button
                        type="button"
                        className="inline-flex items-center justify-center rounded hover:bg-muted/50 p-0.5 shrink-0"
                     >
                        <MoreHorizontal className="size-3.5 text-muted-foreground" />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                     <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="size-3.5" />
                        Edit view
                     </DropdownMenuItem>
                     <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="size-3.5" />
                        Delete view
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
            <span className="text-xs text-muted-foreground">
               {count}{' '}
               {view.type === 'issue'
                  ? count === 1
                     ? 'issue'
                     : 'issues'
                  : count === 1
                    ? 'project'
                    : 'projects'}
            </span>
            {view.type === 'issue' && (
               <Button
                  size="xs"
                  variant={openPanel === 'insights' ? 'secondary' : 'ghost'}
                  onClick={() => togglePanel('insights')}
               >
                  <BarChart3 className="size-4" />
               </Button>
            )}
         </div>

         <CreateViewDialog editingView={view} open={editOpen} onOpenChange={setEditOpen} />

         <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Delete view &ldquo;{view.name}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                     This will permanently delete this saved view. This action cannot be undone.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete view</AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
}
