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
import { useCreateLabel, useLabels } from '@/hooks/queries/use-labels-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { Loader2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

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

/** Workspace project-label settings, mirroring Linear's label inventory view. */
export default function ProjectLabelsSettings() {
   const [query, setQuery] = useState('');
   const { data: projects = [] } = useProjects();
   const { data: labels = [] } = useLabels('project');
   const createLabel = useCreateLabel();
   const { orgId } = useParams<{ orgId: string }>();
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [newLabelName, setNewLabelName] = useState('');
   const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_OPTIONS[0]);

   const rows = useMemo(() => {
      const counts = new Map<string, number>();
      for (const project of projects) {
         for (const label of project.labels) {
            counts.set(label.id, (counts.get(label.id) ?? 0) + 1);
         }
      }
      return labels
         .map((label) => ({ ...label, projects: counts.get(label.id) ?? 0 }))
         .filter((label) => label.name.toLowerCase().includes(query.toLowerCase()))
         .sort((a, b) => a.name.localeCompare(b.name));
   }, [labels, projects, query]);

   const handleCreateLabel = async (event: FormEvent) => {
      event.preventDefault();
      const name = newLabelName.trim();
      if (!name) return;
      await createLabel.mutateAsync({
         id: `project-${slugify(name)}`,
         workspaceId: orgId,
         name,
         color: newLabelColor,
         scope: 'project',
      });
      setIsCreateOpen(false);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLOR_OPTIONS[0]);
   };

   return (
      <div className="w-full overflow-y-auto h-full">
         <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
            <h1 className="text-2xl font-medium mb-2">Project labels</h1>
            <p className="text-sm text-muted-foreground mb-6">
               Categorize projects with reusable labels and filter them across your workspace.
            </p>

            <div className="flex items-center justify-between gap-3 mb-6">
               <Input
                  placeholder="Filter by name..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-64 h-8"
               />
               <Button size="xs" onClick={() => setIsCreateOpen(true)}>
                  New label
               </Button>
            </div>

            <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground border-b">
               <div className="flex-1 min-w-0">Name</div>
               <div className="w-[100px]">Projects</div>
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
                  <div className="w-[100px] text-xs text-muted-foreground">
                     {label.projects || ''}
                  </div>
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
                     <DialogTitle>New project label</DialogTitle>
                     <DialogDescription>Create a reusable label for projects.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="new-project-label-name">Name</FormLabel>
                        <Input
                           id="new-project-label-name"
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
