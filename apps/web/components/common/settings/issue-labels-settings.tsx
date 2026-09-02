'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label as FormLabel } from '@/components/ui/label';
import { useIssues } from '@/hooks/queries/use-issues-query';
import { useCreateLabel, useLabels } from '@/hooks/queries/use-labels-query';
import { Loader2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { SelectMenu } from './shared';

/** Matches the color names already used by existing labels (label.color is a CSS color keyword). */
const LABEL_COLOR_OPTIONS = [
   'red',
   'orange',
   'yellow',
   'green',
   'teal',
   'cyan',
   'blue',
   'indigo',
   'purple',
   'pink',
   'gray',
];

const slugify = (value: string) =>
   value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

/** Invented descriptions for a few labels (Linear shows a Description column). */
const DESCRIPTIONS: Record<string, string> = {
   bug: 'Something is broken and needs a fix',
   accessibility: 'Keyboard, focus and screen-reader work',
   performance: 'Speed, memory and bundle size work',
};

const hashString = (value: string): number => {
   let hash = 0;
   for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
   return hash;
};

const LAST_APPLIED = [
   '12 minutes ago',
   '41 minutes ago',
   '3 hours ago',
   '17 hours ago',
   '2 days ago',
   '6 days ago',
];
const CREATED = ['Sep 2023', 'Jan 2024', 'Jun 2024', 'Feb 2025', 'Jun 2025', 'Jul 12'];

const formatCount = (count: number) =>
   count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);

/** Workspace "Issue labels" settings: filterable table of every label. */
export default function IssueLabelsSettings() {
   const [query, setQuery] = useState('');
   const { data: issues = [] } = useIssues();
   const { data: labels = [] } = useLabels();
   const createLabel = useCreateLabel();

   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [newLabelName, setNewLabelName] = useState('');
   const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_OPTIONS[0]);

   const handleCreateLabel = async (event: FormEvent) => {
      event.preventDefault();
      const name = newLabelName.trim();
      if (!name) return;
      await createLabel.mutateAsync({ id: slugify(name), name, color: newLabelColor });
      setIsCreateOpen(false);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLOR_OPTIONS[0]);
   };

   const rows = useMemo(() => {
      const counts = new Map<string, number>();
      for (const issue of issues) {
         for (const label of issue.labels) {
            counts.set(label.id, (counts.get(label.id) ?? 0) + 1);
         }
      }
      return labels
         .map((label) => ({
            ...label,
            issues: counts.get(label.id) ?? 0,
            description: DESCRIPTIONS[label.id],
            lastApplied: LAST_APPLIED[hashString(label.id) % LAST_APPLIED.length],
            created: CREATED[hashString(label.name) % CREATED.length],
         }))
         .filter((label) => label.name.toLowerCase().includes(query.toLowerCase()))
         .sort((a, b) => a.name.localeCompare(b.name));
   }, [query, issues, labels]);

   return (
      <div className="w-full overflow-y-auto h-full">
         <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
            <h1 className="text-2xl font-medium mb-6">Issue labels</h1>

            <div className="flex items-center justify-between gap-3 mb-6">
               <div className="flex items-center gap-2">
                  <Input
                     placeholder="Filter by name..."
                     value={query}
                     onChange={(event) => setQuery(event.target.value)}
                     className="w-64 h-8"
                  />
                  <SelectMenu options={['Workspace', 'All teams']} />
               </div>
               <div className="flex items-center gap-2">
                  <Button size="xs" variant="secondary">
                     New group
                  </Button>
                  <Button size="xs" onClick={() => setIsCreateOpen(true)}>
                     New label
                  </Button>
               </div>
            </div>

            {/* Header */}
            <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground border-b">
               <div className="flex-1 min-w-0">Name ↓</div>
               <div className="hidden md:block w-[260px]">Description</div>
               <div className="w-[70px]">Issues</div>
               <div className="hidden sm:block w-[110px]">Last applied</div>
               <div className="w-[80px]">Created</div>
            </div>

            {rows.map((label) => (
               <div
                  key={label.id}
                  className="flex items-center px-2 py-2.5 text-sm border-b border-muted-foreground/5 hover:bg-sidebar/50"
               >
                  <div className="flex-1 min-w-0 flex items-center gap-2.5">
                     <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: label.color }}
                     />
                     <span className="truncate">{label.name}</span>
                  </div>
                  <div className="hidden md:block w-[260px] text-xs text-muted-foreground truncate pr-4">
                     {label.description}
                  </div>
                  <div className="w-[70px] text-xs text-muted-foreground">
                     {label.issues > 0 && formatCount(label.issues)}
                  </div>
                  <div className="hidden sm:block w-[110px] text-xs text-muted-foreground">
                     {label.issues > 0 && label.lastApplied}
                  </div>
                  <div className="w-[80px] text-xs text-muted-foreground">{label.created}</div>
               </div>
            ))}
            {rows.length === 0 && (
               <p className="text-sm text-muted-foreground py-6">No labels match your filter.</p>
            )}
         </div>

         <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="sm:max-w-[420px]">
               <form onSubmit={handleCreateLabel}>
                  <DialogHeader>
                     <DialogTitle>New label</DialogTitle>
                     <DialogDescription>Create a label to organize issues.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="new-label-name">Name</FormLabel>
                        <Input
                           id="new-label-name"
                           value={newLabelName}
                           onChange={(event) => setNewLabelName(event.target.value)}
                           disabled={createLabel.isPending}
                           autoFocus
                           required
                        />
                     </div>
                     <div className="space-y-1.5">
                        <FormLabel>Color</FormLabel>
                        <div className="flex flex-wrap gap-2">
                           {LABEL_COLOR_OPTIONS.map((color) => (
                              <button
                                 key={color}
                                 type="button"
                                 onClick={() => setNewLabelColor(color)}
                                 aria-label={color}
                                 className={`size-7 rounded-full transition-all ${
                                    newLabelColor === color
                                       ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                                       : ''
                                 }`}
                                 style={{ backgroundColor: color }}
                              />
                           ))}
                        </div>
                     </div>
                  </div>
                  <DialogFooter>
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreateOpen(false)}
                     >
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        size="sm"
                        disabled={createLabel.isPending || !newLabelName.trim()}
                     >
                        {createLabel.isPending ? (
                           <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                           'Create label'
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>
      </div>
   );
}
