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
import {
   useCreateLabel,
   useCreateLabelGroup,
   useDeleteLabel,
   useDeleteLabelGroup,
   useLabelGroups,
   useLabels,
   useUpdateLabel,
   useUpdateLabelGroup,
} from '@/hooks/queries/use-labels-query';
import type { LabelGroup, LabelItem } from '@/services/labels.service';
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
   const { data: groups = [] } = useLabelGroups('project');
   const createLabel = useCreateLabel();
   const createLabelGroup = useCreateLabelGroup();
   const updateLabel = useUpdateLabel();
   const deleteLabel = useDeleteLabel();
   const updateLabelGroup = useUpdateLabelGroup();
   const deleteLabelGroup = useDeleteLabelGroup();
   const { orgId } = useParams<{ orgId: string }>();
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [newLabelName, setNewLabelName] = useState('');
   const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_OPTIONS[0]);
   const [newLabelGroupId, setNewLabelGroupId] = useState('');
   const [isGroupOpen, setIsGroupOpen] = useState(false);
   const [newGroupName, setNewGroupName] = useState('');
   const [newGroupMutuallyExclusive, setNewGroupMutuallyExclusive] = useState(false);
   const [editingLabel, setEditingLabel] = useState<LabelItem | null>(null);
   const [editLabelName, setEditLabelName] = useState('');
   const [editLabelColor, setEditLabelColor] = useState(LABEL_COLOR_OPTIONS[0]);
   const [editLabelGroupId, setEditLabelGroupId] = useState('');
   const [editingGroup, setEditingGroup] = useState<LabelGroup | null>(null);
   const [editGroupName, setEditGroupName] = useState('');
   const [editGroupMutuallyExclusive, setEditGroupMutuallyExclusive] = useState(false);

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
         ...(newLabelGroupId ? { groupId: newLabelGroupId } : {}),
      });
      setIsCreateOpen(false);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLOR_OPTIONS[0]);
      setNewLabelGroupId('');
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
               <div className="flex items-center gap-2">
                  <Button size="xs" variant="secondary" onClick={() => setIsGroupOpen(true)}>
                     New group
                  </Button>
                  <Button size="xs" onClick={() => setIsCreateOpen(true)}>
                     New label
                  </Button>
               </div>
            </div>

            <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground border-b">
               <div className="flex-1 min-w-0">Name</div>
               <div className="w-[100px]">Projects</div>
            </div>
            {groups.length > 0 && (
               <div className="flex flex-wrap gap-2 py-3 border-b">
                  {groups.map((group) => (
                     <div
                        key={group.id}
                        className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs"
                     >
                        <span>{group.name}</span>
                        {group.mutuallyExclusive && (
                           <span className="text-muted-foreground">exclusive</span>
                        )}
                        <button
                           type="button"
                           className="text-muted-foreground hover:text-foreground"
                           onClick={() => {
                              setEditingGroup(group);
                              setEditGroupName(group.name);
                              setEditGroupMutuallyExclusive(group.mutuallyExclusive);
                           }}
                        >
                           Edit
                        </button>
                        <button
                           type="button"
                           className="text-destructive hover:text-destructive/80"
                           onClick={() => {
                              if (window.confirm(`Delete label group "${group.name}"?`)) {
                                 deleteLabelGroup.mutate(group.id);
                              }
                           }}
                        >
                           Delete
                        </button>
                     </div>
                  ))}
               </div>
            )}
            {rows.map((label, index) => (
               <div key={label.id}>
                  {label.groupId &&
                     groups.find((group) => group.id === label.groupId)?.name &&
                     (!rows[index - 1] || rows[index - 1].groupId !== label.groupId) && (
                        <div className="px-2 pt-4 pb-1 text-xs font-medium text-muted-foreground">
                           {groups.find((group) => group.id === label.groupId)?.name}
                        </div>
                     )}
                  <div className="flex items-center px-2 py-2.5 text-sm border-b border-muted-foreground/5 hover:bg-sidebar/50">
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
                     <div className="flex items-center gap-1 ml-3">
                        <Button
                           type="button"
                           size="xs"
                           variant="ghost"
                           onClick={() => {
                              setEditingLabel(label);
                              setEditLabelName(label.name);
                              setEditLabelColor(label.color);
                              setEditLabelGroupId(label.groupId ?? '');
                           }}
                        >
                           Edit
                        </Button>
                        <Button
                           type="button"
                           size="xs"
                           variant="ghost"
                           className="text-destructive"
                           disabled={deleteLabel.isPending}
                           onClick={() => {
                              if (window.confirm(`Delete label "${label.name}"?`)) {
                                 deleteLabel.mutate(label.id);
                              }
                           }}
                        >
                           Delete
                        </Button>
                     </div>
                  </div>
               </div>
            ))}
            {rows.length === 0 && (
               <p className="text-sm text-muted-foreground py-6">No labels match your filter.</p>
            )}
         </div>

         <Dialog
            open={Boolean(editingLabel)}
            onOpenChange={(open) => !open && setEditingLabel(null)}
         >
            <DialogContent className="sm:max-w-[420px]">
               <form
                  onSubmit={async (event) => {
                     event.preventDefault();
                     if (!editingLabel || !editLabelName.trim()) return;
                     await updateLabel.mutateAsync({
                        id: editingLabel.id,
                        payload: {
                           name: editLabelName.trim(),
                           color: editLabelColor,
                           scope: 'project',
                           groupId: editLabelGroupId || undefined,
                        },
                     });
                     setEditingLabel(null);
                  }}
               >
                  <DialogHeader>
                     <DialogTitle>Edit project label</DialogTitle>
                     <DialogDescription>Update the label and reassign its group.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="edit-project-label-name">Name</FormLabel>
                        <Input
                           id="edit-project-label-name"
                           value={editLabelName}
                           onChange={(event) => setEditLabelName(event.target.value)}
                           disabled={updateLabel.isPending}
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
                                 onClick={() => setEditLabelColor(color)}
                                 aria-label={color}
                                 className={`size-7 rounded-full ${editLabelColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : ''}`}
                                 style={{ backgroundColor: color }}
                              />
                           ))}
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="edit-project-label-group">Group</FormLabel>
                        <select
                           id="edit-project-label-group"
                           value={editLabelGroupId}
                           onChange={(event) => setEditLabelGroupId(event.target.value)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           <option value="">No group</option>
                           {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                 {group.name}
                              </option>
                           ))}
                        </select>
                     </div>
                  </div>
                  <DialogFooter>
                     <Button type="button" variant="ghost" onClick={() => setEditingLabel(null)}>
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        disabled={updateLabel.isPending || !editLabelName.trim()}
                     >
                        {updateLabel.isPending ? 'Saving...' : 'Save changes'}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>

         <Dialog
            open={Boolean(editingGroup)}
            onOpenChange={(open) => !open && setEditingGroup(null)}
         >
            <DialogContent className="sm:max-w-[420px]">
               <form
                  onSubmit={async (event) => {
                     event.preventDefault();
                     if (!editingGroup || !editGroupName.trim()) return;
                     await updateLabelGroup.mutateAsync({
                        id: editingGroup.id,
                        payload: {
                           name: editGroupName.trim(),
                           scope: 'project',
                           mutuallyExclusive: editGroupMutuallyExclusive,
                        },
                     });
                     setEditingGroup(null);
                  }}
               >
                  <DialogHeader>
                     <DialogTitle>Edit project label group</DialogTitle>
                     <DialogDescription>
                        Rename the group or change its selection rule.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-3">
                     <FormLabel htmlFor="edit-project-label-group-name">Name</FormLabel>
                     <Input
                        id="edit-project-label-group-name"
                        value={editGroupName}
                        onChange={(event) => setEditGroupName(event.target.value)}
                        disabled={updateLabelGroup.isPending}
                        autoFocus
                        required
                     />
                     <label className="flex items-center gap-2 text-sm">
                        <input
                           type="checkbox"
                           checked={editGroupMutuallyExclusive}
                           onChange={(event) => setEditGroupMutuallyExclusive(event.target.checked)}
                        />
                        Mutually exclusive
                     </label>
                  </div>
                  <DialogFooter>
                     <Button type="button" variant="ghost" onClick={() => setEditingGroup(null)}>
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        disabled={updateLabelGroup.isPending || !editGroupName.trim()}
                     >
                        {updateLabelGroup.isPending ? 'Saving...' : 'Save changes'}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>

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
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="new-project-label-group">Group</FormLabel>
                        <select
                           id="new-project-label-group"
                           value={newLabelGroupId}
                           onChange={(event) => setNewLabelGroupId(event.target.value)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           <option value="">No group</option>
                           {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                 {group.name}
                              </option>
                           ))}
                        </select>
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

         <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
            <DialogContent className="sm:max-w-[420px]">
               <form
                  onSubmit={async (event) => {
                     event.preventDefault();
                     const name = newGroupName.trim();
                     if (!name) return;
                     await createLabelGroup.mutateAsync({
                        workspaceId: orgId,
                        name,
                        scope: 'project',
                        mutuallyExclusive: newGroupMutuallyExclusive,
                     });
                     setNewGroupName('');
                     setNewGroupMutuallyExclusive(false);
                     setIsGroupOpen(false);
                  }}
               >
                  <DialogHeader>
                     <DialogTitle>New project label group</DialogTitle>
                     <DialogDescription>
                        Group project labels and optionally allow only one label from the group.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-3">
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="new-project-label-group-name">Name</FormLabel>
                        <Input
                           id="new-project-label-group-name"
                           value={newGroupName}
                           onChange={(event) => setNewGroupName(event.target.value)}
                           disabled={createLabelGroup.isPending}
                           autoFocus
                           required
                        />
                     </div>
                     <label className="flex items-center gap-2 text-sm">
                        <input
                           type="checkbox"
                           checked={newGroupMutuallyExclusive}
                           onChange={(event) => setNewGroupMutuallyExclusive(event.target.checked)}
                        />
                        Mutually exclusive
                     </label>
                  </div>
                  <DialogFooter>
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsGroupOpen(false)}
                     >
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        size="sm"
                        disabled={createLabelGroup.isPending || !newGroupName.trim()}
                     >
                        {createLabelGroup.isPending ? (
                           <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                           'Create group'
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>
      </div>
   );
}
