'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useProject, useDeleteProject } from '@/hooks/queries/use-projects-query';
import { useViews, useDeleteView, CustomView } from '@/hooks/queries/use-views-query';
import { useRightPanelStore } from '@/store/right-panel-store';
import {
   BarChart3,
   ChevronRight,
   Layers,
   Link2,
   MoreHorizontal,
   PanelRight,
   Plus,
   Star,
   Trash2,
} from 'lucide-react';
import { renderProjectIcon } from '@/lib/project-utils';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AddViewDialog } from './add-view-dialog';
import { IssueFilterTrigger } from '@/components/common/issues/issue-filter-trigger';
import { DisplayOptions } from '@/components/layout/headers/display-options';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import QueryErrorState from '@/components/common/query-error-state';

const BASE_PROJECT_TABS = [
   { label: 'Overview', segment: 'overview' },
   { label: 'Activity', segment: 'activity' },
   { label: 'Issues', segment: 'issues' },
];

function ProjectTabs({ projectId }: { projectId: string }) {
   const { orgId } = useParams<{ orgId: string }>();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const router = useRouter();
   const activeViewId = searchParams.get('view');
   const [isAddViewOpen, setIsAddViewOpen] = useState(false);

   const { data: views = [], error, refetch } = useViews({ projectId });
   const deleteViewMutation = useDeleteView();

   if (error) {
      return (
         <QueryErrorState subject="project views" error={error} onRetry={() => refetch()} compact />
      );
   }

   const isIssuesPath = pathname === `/${orgId}/project/${projectId}/issues`;

   // Only navigate here: the destination page (ProjectIssues) re-applies the
   // view's filters/layout/display settings itself once it reads `?view=`
   // off the URL. Calling the nuqs-backed filter setters from this handler
   // races router.push — nuqs flushes its own (stale) URL snapshot shortly
   // after, wiping the `view` param this push just set, regardless of call
   // order.
   const handleSelectCustomView = (view: CustomView) => {
      router.push(`/${orgId}/project/${projectId}/issues?view=${view.id}`);
   };

   const handleDeleteCustomView = async (e: React.MouseEvent, viewId: string) => {
      e.stopPropagation();
      try {
         await deleteViewMutation.mutateAsync(viewId);
         if (activeViewId === viewId) {
            router.push(`/${orgId}/project/${projectId}/issues`);
         }
      } catch (err) {
         console.error('Failed to delete view:', err);
      }
   };

   return (
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
         {/* Base tabs: Overview, Activity, Issues */}
         {BASE_PROJECT_TABS.map((tab) => {
            const href = `/${orgId}/project/${projectId}/${tab.segment}`;
            const isTabActive =
               tab.segment === 'issues' ? isIssuesPath && !activeViewId : pathname === href;

            return (
               <Link
                  key={tab.segment}
                  href={href}
                  aria-current={isTabActive ? 'page' : undefined}
                  className={cn(
                     'px-2.5 h-7 inline-flex items-center rounded-full border text-xs font-medium transition-colors shrink-0',
                     isTabActive
                        ? 'bg-accent text-foreground border-border font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
               >
                  {tab.label}
               </Link>
            );
         })}

         {/* Saved custom views for this project */}
         {views.map((view) => {
            const isViewActive = isIssuesPath && activeViewId === view.id;

            return (
               <div
                  key={view.id}
                  onClick={() => handleSelectCustomView(view)}
                  className={cn(
                     'group relative px-2.5 h-7 inline-flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors shrink-0 cursor-pointer',
                     isViewActive
                        ? 'bg-accent text-foreground border-border font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
               >
                  <span className="text-xs leading-none">{view.icon || '🧊'}</span>
                  <span>{view.name}</span>

                  {/* Context menu for delete/rename */}
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button
                           className="opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground p-0.5 rounded transition-opacity"
                           title="View options"
                        >
                           <MoreHorizontal className="size-3" />
                        </button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-36 text-xs p-1">
                        <DropdownMenuItem
                           onClick={(e) => handleDeleteCustomView(e, view.id)}
                           className="text-red-500 hover:text-red-600 focus:text-red-600 flex items-center gap-2 cursor-pointer"
                        >
                           <Trash2 className="size-3.5" />
                           Delete view
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            );
         })}

         {/* Add View button matching Linear 1:1 (Image 1) */}
         <button
            onClick={() => setIsAddViewOpen(true)}
            title="Add view"
            className="px-2 h-7 inline-flex items-center justify-center rounded-full border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer shrink-0"
         >
            <div className="relative flex items-center justify-center">
               <Layers className="size-3.5" />
               <Plus className="size-2.5 absolute -top-1 -right-1 stroke-[3]" />
            </div>
         </button>

         {/* Add View Dialog */}
         <AddViewDialog
            open={isAddViewOpen}
            onOpenChange={setIsAddViewOpen}
            projectId={projectId}
         />
      </div>
   );
}

function PanelToggles() {
   const { openPanel, togglePanel } = useRightPanelStore();

   return (
      <div className="flex items-center gap-1 shrink-0">
         <Button
            size="xs"
            variant={openPanel === 'insights' ? 'secondary' : 'ghost'}
            onClick={() => togglePanel('insights')}
            aria-label="Toggle insights panel"
         >
            <BarChart3 className="size-4" />
         </Button>
         <Button
            size="xs"
            variant={openPanel === 'hidden' ? 'ghost' : 'secondary'}
            onClick={() => togglePanel('hidden')}
            aria-label="Toggle side panel"
         >
            <PanelRight className="size-4" />
         </Button>
      </div>
   );
}

export default function Header({ projectId }: { projectId: string }) {
   const { orgId } = useParams<{ orgId: string }>();
   const pathname = usePathname();
   const router = useRouter();
   const isIssuesPath = pathname === `/${orgId}/project/${projectId}/issues`;
   const { data: project } = useProject(projectId);
   const deleteProjectMutation = useDeleteProject();
   const [deleteOpen, setDeleteOpen] = useState(false);
   if (!project) return null;

   const handleCopyLink = () => {
      const url = `${window.location.origin}/${orgId}/project/${projectId}/overview`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
   };

   const handleDelete = async () => {
      await deleteProjectMutation.mutateAsync(projectId);
      setDeleteOpen(false);
      router.push(`/${orgId}/projects`);
   };

   return (
      <>
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
            <div className="flex items-center gap-2 min-w-0">
               <SidebarTrigger className="" />
               <div className="flex items-center gap-1.5 text-sm min-w-0">
                  <Link
                     href={`/${orgId}/projects`}
                     className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                     Projects
                  </Link>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="inline-flex size-5 bg-muted/50 items-center justify-center rounded shrink-0">
                     {renderProjectIcon(project.icon, 'size-3.5')}
                  </span>
                  <span className="font-medium truncate">{project.name}</span>
                  <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
                     <Star className="size-3.5" />
                  </Button>
               </div>
            </div>
            <div className="flex items-center gap-1">
               <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={handleCopyLink}
               >
                  <Link2 className="size-4" />
               </Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                        <MoreHorizontal className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="size-3.5" />
                        Delete project
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>

         <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Delete project &ldquo;{project.name}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                     This will permanently delete this project and cannot be undone.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete project</AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
            <ProjectTabs projectId={project.id} />
            <div className="flex items-center gap-1 shrink-0">
               {isIssuesPath && (
                  <>
                     <IssueFilterTrigger />
                     <DisplayOptions />
                     <div className="h-4 w-px bg-border/60 mx-1" />
                  </>
               )}
               <PanelToggles />
            </div>
         </div>
      </>
   );
}
