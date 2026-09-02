'use client';

import { useMemo, useState } from 'react';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { useCreateView } from '@/hooks/queries/use-views-query';
import { useFilterStore } from '@/store/filter-store';
import { useDisplaySettingsStore } from '@/store/display-settings-store';
import { useViewStore } from '@/store/view-store';
import { useIssuesStore } from '@/store/issues-store';
import { useMembers } from '@/hooks/queries/use-members-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { useCycles } from '@/hooks/queries/use-cycles-query';
import { buildIssueFilterColumns } from '@/components/common/issues/issue-filter-columns';
import { useDataTableFilters } from '@/components/data-table-filter';
import { ActiveFilters } from '@/components/data-table-filter/components/active-filters';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

interface AddViewDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   teamId: string;
}

const VIEW_ICONS = ['🧊', '📋', '⚡', '🐛', '🎯', '🚀', '🔥', '✨', '📦', '🔍'];

export function AddViewDialog({ open, onOpenChange, teamId }: AddViewDialogProps) {
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const [icon, setIcon] = useState('🧊');
   const { viewType } = useViewStore();
   const [layout, setLayout] = useState<'list' | 'grid'>(viewType);
   const [includeSettings, setIncludeSettings] = useState(true);

   const createViewMutation = useCreateView();
   const { filters, setFilters } = useFilterStore();
   const displaySettings = useDisplaySettingsStore();
   const router = useRouter();
   const pathname = usePathname();

   // Same data + columns the Issues page filter bar uses, so the chips shown
   // here (what will actually be saved) are pixel-identical to what the user
   // just set up — no guessing what "active filters" refers to.
   const { issues } = useIssuesStore();
   const { data: members = [] } = useMembers();
   const { data: projects = [] } = useProjects();
   const { data: cycles = [] } = useCycles();
   const columnsConfig = useMemo(
      () => buildIssueFilterColumns(members, projects, cycles),
      [members, projects, cycles]
   );
   const { columns, actions, strategy } = useDataTableFilters({
      strategy: 'client',
      data: issues,
      columnsConfig,
      filters,
      onFiltersChange: setFilters,
   });

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      const filterPayload = includeSettings
         ? {
              filters,
              grouping: displaySettings.grouping,
              ordering: displaySettings.ordering,
              orderCompletedByRecency: displaySettings.orderCompletedByRecency,
              completedIssues: displaySettings.completedIssues,
              showSubIssues: displaySettings.showSubIssues,
              nestedSubIssues: displaySettings.nestedSubIssues,
              showEmptyGroups: displaySettings.showEmptyGroups,
              showEmptyColumns: displaySettings.showEmptyColumns,
              displayProperties: displaySettings.displayProperties,
           }
         : {};

      try {
         const newView = await createViewMutation.mutateAsync({
            name: name.trim(),
            description: description.trim(),
            icon,
            teamId,
            layout,
            type: 'issue',
            filter: filterPayload,
         });

         onOpenChange(false);
         setName('');
         setDescription('');

         // Navigate to newly created view
         if (newView?.id) {
            router.push(`${pathname}?view=${newView.id}`);
         }
      } catch (err) {
         console.error('Failed to create view:', err);
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-md shadow-2xl rounded-xl border border-border/80 p-0 overflow-hidden">
            <form onSubmit={handleSave}>
               <DialogHeader className="px-5 pt-5 pb-3 border-b">
                  <DialogTitle className="text-base font-semibold">New view</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                     Save custom filters and display settings for these issues.
                  </DialogDescription>
               </DialogHeader>

               <div className="p-5 space-y-4">
                  {/* Name and Icon */}
                  <div className="space-y-1.5">
                     <Label htmlFor="view-name" className="text-xs font-medium">
                        View name
                     </Label>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-accent/60 px-2 h-8 rounded-md border border-border/60">
                           <span className="text-base">{icon}</span>
                        </div>
                        <Input
                           id="view-name"
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                           placeholder="e.g. Active Bugs, In Progress, Sprint Review"
                           className="h-8 text-xs flex-1"
                           autoFocus
                           required
                        />
                     </div>
                  </div>

                  {/* Icon palette */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                     {VIEW_ICONS.map((emoji) => (
                        <button
                           key={emoji}
                           type="button"
                           onClick={() => setIcon(emoji)}
                           className={cn(
                              'size-7 flex items-center justify-center rounded-md text-sm hover:bg-accent transition-colors',
                              icon === emoji
                                 ? 'bg-accent border border-border shadow-xs'
                                 : 'opacity-70 hover:opacity-100'
                           )}
                        >
                           {emoji}
                        </button>
                     ))}
                  </div>

                  {/* Layout Selector */}
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium">Layout</Label>
                     <div className="grid grid-cols-2 gap-2">
                        <button
                           type="button"
                           onClick={() => setLayout('list')}
                           className={cn(
                              'flex items-center justify-center gap-2 h-8 rounded-md text-xs font-medium border transition-colors',
                              layout === 'list'
                                 ? 'border-indigo-500/50 bg-indigo-500/10 text-foreground'
                                 : 'border-border/60 text-muted-foreground hover:bg-accent/40'
                           )}
                        >
                           <LayoutList className="size-3.5" />
                           List
                        </button>
                        <button
                           type="button"
                           onClick={() => setLayout('grid')}
                           className={cn(
                              'flex items-center justify-center gap-2 h-8 rounded-md text-xs font-medium border transition-colors',
                              layout === 'grid'
                                 ? 'border-indigo-500/50 bg-indigo-500/10 text-foreground'
                                 : 'border-border/60 text-muted-foreground hover:bg-accent/40'
                           )}
                        >
                           <LayoutGrid className="size-3.5" />
                           Board
                        </button>
                     </div>
                  </div>

                  {/* Include current filters toggle, with a live preview of what that means */}
                  <div className="space-y-2 pt-1">
                     <div className="flex items-center justify-between">
                        <Label
                           htmlFor="include-settings"
                           className="text-xs text-muted-foreground font-normal cursor-pointer"
                        >
                           Include filters & grouping from this page
                        </Label>
                        <input
                           type="checkbox"
                           id="include-settings"
                           checked={includeSettings}
                           onChange={(e) => setIncludeSettings(e.target.checked)}
                           className="size-4 rounded border-border accent-indigo-600 cursor-pointer"
                        />
                     </div>

                     {includeSettings && (
                        <div className="rounded-md border border-border/60 bg-accent/20 p-2 space-y-1.5">
                           {filters.length > 0 ? (
                              <ActiveFilters
                                 columns={columns}
                                 filters={filters}
                                 actions={actions}
                                 strategy={strategy}
                              />
                           ) : (
                              <p className="text-[11px] text-muted-foreground">
                                 No filters applied — this view will show every issue.
                              </p>
                           )}
                           <p className="text-[11px] text-muted-foreground">
                              Grouped by{' '}
                              <span className="font-medium">{displaySettings.grouping}</span>,
                              ordered by{' '}
                              <span className="font-medium">{displaySettings.ordering}</span>.
                           </p>
                        </div>
                     )}
                  </div>
               </div>

               <DialogFooter className="px-5 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
                  <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => onOpenChange(false)}
                     className="h-8 text-xs text-muted-foreground"
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     size="sm"
                     disabled={!name.trim() || createViewMutation.isPending}
                     className="h-8 text-xs font-medium bg-foreground text-background hover:opacity-90"
                  >
                     {createViewMutation.isPending ? 'Saving...' : 'Save view'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
