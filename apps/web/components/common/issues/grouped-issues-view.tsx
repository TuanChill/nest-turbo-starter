'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Issue } from '@/mock-data/issues';
import { sortIssuesByPriority } from '@/lib/issue-sorting';
import { priorities } from '@/lib/priority-catalog';
import { Status } from '@/lib/workflow-status';
import { useDisplaySettingsStore } from '@/store/display-settings-store';
import { useFilterStore } from '@/store/filter-store';
import { Box, ChevronDown, User, X } from 'lucide-react';
import { renderProjectIcon } from '@/lib/project-utils';
import { FC, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GroupIssues, IssueGroupDescriptor } from './group-issues';
import { CustomDragLayer } from './issue-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyIssuesState } from './empty-issues-state';
import { CreateIssueOptions } from '@/store/create-issue-store';
import { useIssuesStore } from '@/store/issues-store';

interface GroupedIssuesViewProps {
   /** Issues to display (after the filter bar has been applied). */
   issues: Issue[];
   /** Same scope of issues, before the filter bar — used for "hidden by filters" counts. */
   totalIssues: Issue[];
   /** Statuses to render when grouping by status (empty groups are skipped unless enabled). */
   statuses: Status[];
   isViewTypeGrid: boolean;
   emptyStateTitle?: string;
   emptyStateSubtitle?: string;
   emptyStateDescription?: string;
   contextOptions?: CreateIssueOptions;
}

interface GroupEntry {
   group: IssueGroupDescriptor;
   issues: Issue[];
   /** Count of issues in this group before the filter bar. */
   total: number;
}

const sortIssues = (issues: Issue[], ordering: string, direction: 'asc' | 'desc'): Issue[] => {
   const ascending = (() => {
      switch (ordering) {
         case 'created':
            return [...issues].sort(
               (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
         case 'title':
            return [...issues].sort((a, b) => a.title.localeCompare(b.title));
         case 'priority':
         default:
            return sortIssuesByPriority(issues);
      }
   })();
   return direction === 'desc' ? ascending.reverse() : ascending;
};

const groupByKey = (issues: Issue[], keyOf: (issue: Issue) => string): Map<string, Issue[]> => {
   const map = new Map<string, Issue[]>();
   for (const issue of issues) {
      const key = keyOf(issue);
      map.set(key, [...(map.get(key) ?? []), issue]);
   }
   return map;
};

/** Footer shown when active filters hide issues — "n issues hidden by filters". */
function HiddenByFiltersFooter({ hiddenCount }: { hiddenCount: number }) {
   const { clearFilters } = useFilterStore();

   return (
      <div className="flex items-center justify-center gap-3 py-4 text-xs text-muted-foreground">
         <span>
            <span className="font-medium text-foreground">
               {hiddenCount} {hiddenCount === 1 ? 'issue' : 'issues'}
            </span>{' '}
            hidden by filters
         </span>
         <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
         >
            Clear filters
            <X className="size-3" />
         </button>
      </div>
   );
}

/** Board-only list of columns fully emptied by the active filters ("0 / n"). */
function HiddenColumns({ entries }: { entries: GroupEntry[] }) {
   const [open, setOpen] = useState(true);

   return (
      <div className="shrink-0 w-[280px] pt-1">
         <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
         >
            <ChevronDown className={cn('size-3.5 transition-transform', !open && '-rotate-90')} />
            Hidden columns
         </button>
         {open && (
            <div className="flex flex-col gap-1.5 mt-1">
               {entries.map((entry) => (
                  <div
                     key={entry.group.id}
                     className="flex items-center justify-between gap-2 rounded-md border bg-container px-3 h-9"
                  >
                     <div className="flex items-center gap-2 min-w-0">
                        {entry.group.icon}
                        <span className="text-sm truncate">{entry.group.name}</span>
                     </div>
                     <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {entry.total > 0 ? `0 / ${entry.total}` : '0'}
                     </span>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}

/**
 * Issues grouped according to the Display settings (grouping, ordering,
 * completed visibility, empty groups) — list rows or board columns.
 * Shared by the All/Active/Backlog views and the cycle views.
 *
 * When the filter bar hides issues, a "hidden by filters" footer appears
 * (end of the list / bottom of the board) and, on the board, columns fully
 * emptied by the filters collapse into a "Hidden columns" section.
 */
export const GroupedIssuesView: FC<GroupedIssuesViewProps> = ({
   issues,
   totalIssues,
   statuses,
   isViewTypeGrid,
   emptyStateTitle,
   emptyStateSubtitle,
   emptyStateDescription,
   contextOptions,
}) => {
   const { grouping, ordering, sortDirection, completedIssues, showEmptyGroups, showEmptyColumns } =
      useDisplaySettingsStore();
   const { filters } = useFilterStore();
   const { isLoading, isInitialized } = useIssuesStore();
   const hasActiveFilters = filters.length > 0;

   const groups = useMemo<GroupEntry[]>(() => {
      const hideDone = (list: Issue[]) =>
         completedIssues === 'none'
            ? list.filter(
                 (issue) =>
                    issue.status.category !== 'completed' && issue.status.category !== 'canceled'
              )
            : list;

      const visibleIssues = hideDone(issues);
      const scopeIssues = hideDone(totalIssues);

      const buildGroups = (): { group: IssueGroupDescriptor; issues: Issue[]; total: number }[] => {
         switch (grouping) {
            case 'assignee': {
               const keyOf = (issue: Issue) => issue.assignee?.id ?? 'no-assignee';
               const totals = groupByKey(scopeIssues, keyOf);
               const visible = groupByKey(visibleIssues, keyOf);
               return [...totals.entries()]
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([key, totalGroup]) => {
                     const assignee = totalGroup[0].assignee;
                     return {
                        group: {
                           id: key,
                           name: assignee?.name ?? 'No assignee',
                           color: '#8f9299',
                           icon: assignee ? (
                              <Avatar className="size-4">
                                 <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                 <AvatarFallback>{assignee.name[0]}</AvatarFallback>
                              </Avatar>
                           ) : (
                              <User className="size-4 text-muted-foreground" />
                           ),
                           groupBy: 'assignee',
                           assignee: assignee ?? null,
                        },
                        issues: visible.get(key) ?? [],
                        total: totalGroup.length,
                     };
                  });
            }
            case 'priority': {
               return priorities.map((priority) => ({
                  group: {
                     id: priority.id,
                     name: priority.name,
                     color: '#8f9299',
                     icon: <priority.icon className="size-4 text-muted-foreground" />,
                     groupBy: 'priority',
                     priority,
                  },
                  issues: visibleIssues.filter((issue) => issue.priority.id === priority.id),
                  total: scopeIssues.filter((issue) => issue.priority.id === priority.id).length,
               }));
            }
            case 'project': {
               const keyOf = (issue: Issue) => issue.project?.id ?? 'no-project';
               const totals = groupByKey(scopeIssues, keyOf);
               const visible = groupByKey(visibleIssues, keyOf);
               return [...totals.entries()]
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([key, totalGroup]) => {
                     const project = totalGroup[0].project;
                     return {
                        group: {
                           id: key,
                           name: project?.name ?? 'No project',
                           color: '#8f9299',
                           icon: project ? (
                              renderProjectIcon(project.icon, 'size-4 text-muted-foreground')
                           ) : (
                              <Box className="size-4 text-muted-foreground" />
                           ),
                           groupBy: 'project',
                           project,
                        },
                        issues: visible.get(key) ?? [],
                        total: totalGroup.length,
                     };
                  });
            }
            case 'none': {
               return [
                  {
                     group: {
                        id: 'all',
                        name: 'All issues',
                        color: '#8f9299',
                        icon: <Box className="size-4 text-muted-foreground" />,
                     },
                     issues: visibleIssues,
                     total: scopeIssues.length,
                  },
               ];
            }
            case 'status':
            default: {
               return statuses.map((statusItem) => ({
                  group: {
                     id: statusItem.id,
                     name: statusItem.name,
                     color: statusItem.color,
                     icon: <statusItem.icon />,
                     groupBy: 'status',
                     status: statusItem,
                  },
                  issues: visibleIssues.filter((issue) => issue.status.id === statusItem.id),
                  total: scopeIssues.filter((issue) => issue.status.id === statusItem.id).length,
               }));
            }
         }
      };

      return buildGroups().map((entry) => ({
         ...entry,
         issues: sortIssues(entry.issues, ordering, sortDirection),
      }));
   }, [issues, totalIssues, statuses, grouping, ordering, sortDirection, completedIssues]);

   const hiddenCount = Math.max(0, totalIssues.length - issues.length);
   const showFooter = hasActiveFilters && hiddenCount > 0;

   if (!isInitialized && isLoading) {
      if (isViewTypeGrid) {
         return (
            <div className="flex h-full gap-3 px-4 py-3 overflow-hidden">
               {[1, 2, 3].map((col) => (
                  <div
                     key={col}
                     className="w-80 flex flex-col gap-3 rounded-lg border border-border/40 p-3 bg-muted/20"
                  >
                     <div className="flex items-center justify-between pb-2 border-b border-border/30">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="size-4 rounded-full" />
                     </div>
                     <div className="flex flex-col gap-2.5">
                        {[1, 2, 3].map((item) => (
                           <div
                              key={item}
                              className="p-3 rounded-md border border-border/30 bg-background/50 space-y-2"
                           >
                              <Skeleton className="h-4 w-3/4" />
                              <div className="flex items-center justify-between pt-1">
                                 <Skeleton className="h-3 w-16" />
                                 <Skeleton className="size-5 rounded-full" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         );
      }
      return (
         <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
               <div
                  key={i}
                  className="flex items-center gap-4 py-2.5 px-3 rounded border border-border/30"
               >
                  <Skeleton className="size-4 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-20 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24 shrink-0" />
                  <Skeleton className="size-5 rounded-full shrink-0" />
               </div>
            ))}
         </div>
      );
   }

   /* ------------------------------- Board ------------------------------- */
   if (isViewTypeGrid) {
      // With filters on, columns fully emptied by them move to "Hidden columns".
      const boardGroups = hasActiveFilters
         ? groups.filter((entry) => entry.issues.length > 0)
         : groups.filter((entry) => showEmptyColumns || entry.issues.length > 0);
      const hiddenGroups = hasActiveFilters
         ? groups.filter((entry) => entry.issues.length === 0)
         : [];

      return (
         <DndProvider backend={HTML5Backend}>
            <CustomDragLayer />
            <div className="h-full flex flex-col">
               <div className="flex-1 min-h-0 overflow-x-auto">
                  <div className="flex h-full gap-3 px-2 py-2 min-w-max">
                     {boardGroups.map((entry) => (
                        <GroupIssues
                           key={entry.group.id}
                           group={entry.group}
                           issues={entry.issues}
                           count={entry.issues.length}
                        />
                     ))}
                     {hiddenGroups.length > 0 && <HiddenColumns entries={hiddenGroups} />}
                     {boardGroups.length === 0 && hiddenGroups.length === 0 && (
                        <div className="flex items-center justify-center w-full min-h-[320px]">
                           <EmptyIssuesState
                              title={emptyStateTitle}
                              subtitle={emptyStateSubtitle}
                              description={emptyStateDescription}
                              contextOptions={contextOptions}
                              hasActiveFilters={hasActiveFilters}
                           />
                        </div>
                     )}
                  </div>
               </div>
               {showFooter && (
                  <div className="shrink-0 border-t bg-container">
                     <HiddenByFiltersFooter hiddenCount={hiddenCount} />
                  </div>
               )}
            </div>
         </DndProvider>
      );
   }

   /* -------------------------------- List ------------------------------- */
   const listGroups = groups.filter((entry) => showEmptyGroups || entry.issues.length > 0);

   return (
      <DndProvider backend={HTML5Backend}>
         <CustomDragLayer />
         <div className="h-full overflow-y-auto">
            {listGroups.length === 0 && (
               <div className="flex items-center justify-center w-full min-h-[320px]">
                  <EmptyIssuesState
                     title={emptyStateTitle}
                     subtitle={emptyStateSubtitle}
                     description={emptyStateDescription}
                     contextOptions={contextOptions}
                     hasActiveFilters={hasActiveFilters}
                  />
               </div>
            )}
            {listGroups.map((entry) => (
               <GroupIssues
                  key={entry.group.id}
                  group={entry.group}
                  issues={entry.issues}
                  count={entry.issues.length}
               />
            ))}
            {showFooter && listGroups.length > 0 && (
               <HiddenByFiltersFooter hiddenCount={hiddenCount} />
            )}
         </div>
      </DndProvider>
   );
};
