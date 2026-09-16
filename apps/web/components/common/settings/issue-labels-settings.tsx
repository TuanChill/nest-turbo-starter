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
import { useTeams } from '@/hooks/queries/use-teams-query';
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
import { Loader2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
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

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '—');

const formatCount = (count: number) =>
   count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);

/** Workspace "Issue labels" settings: filterable table of every label. */
export default function IssueLabelsSettings() {
   const [query, setQuery] = useState('');
   const { data: issues = [] } = useIssues();
   const { data: teams = [] } = useTeams();
   const [labelTeamFilter, setLabelTeamFilter] = useState('all');
   const { data: labels = [] } = useLabels(
      'issue',
      labelTeamFilter === 'all' ? undefined : labelTeamFilter
   );
   const createLabel = useCreateLabel();
   const createLabelGroup = useCreateLabelGroup();
   const updateLabel = useUpdateLabel();
   const deleteLabel = useDeleteLabel();
   const updateLabelGroup = useUpdateLabelGroup();
   const deleteLabelGroup = useDeleteLabelGroup();
   const { data: groups = [] } = useLabelGroups('issue');
   const { orgId } = useParams<{ orgId: string }>();

   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [newLabelName, setNewLabelName] = useState('');
   const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_OPTIONS[0]);
   const [newLabelGroupId, setNewLabelGroupId] = useState('');
   const [newLabelTeamId, setNewLabelTeamId] = useState('workspace');
   const [isGroupOpen, setIsGroupOpen] = useState(false);
   const [newGroupName, setNewGroupName] = useState('');
   const [newGroupMutuallyExclusive, setNewGroupMutuallyExclusive] = useState(false);
   const [editingLabel, setEditingLabel] = useState<LabelItem | null>(null);
   const [editLabelName, setEditLabelName] = useState('');
   const [editLabelColor, setEditLabelColor] = useState(LABEL_COLOR_OPTIONS[0]);
   const [editLabelGroupId, setEditLabelGroupId] = useState('');
   const [editLabelTeamId, setEditLabelTeamId] = useState('workspace');
   const [editingGroup, setEditingGroup] = useState<LabelGroup | null>(null);
   const [editGroupName, setEditGroupName] = useState('');
   const [editGroupMutuallyExclusive, setEditGroupMutuallyExclusive] = useState(false);

   const handleCreateLabel = async (event: FormEvent) => {
      event.preventDefault();
      const name = newLabelName.trim();
      if (!name) return;
      await createLabel.mutateAsync({
         id: slugify(name),
         workspaceId: orgId,
         name,
         color: newLabelColor,
         scope: 'issue',
         ...(newLabelTeamId !== 'workspace' ? { teamId: newLabelTeamId } : {}),
         ...(newLabelGroupId ? { groupId: newLabelGroupId } : {}),
      });
      setIsCreateOpen(false);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLOR_OPTIONS[0]);
      setNewLabelGroupId('');
      setNewLabelTeamId('workspace');
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
                  <SelectMenu
                     options={[
                        { label: 'All labels', value: 'all' },
                        ...teams.map((team) => ({
                           label: `${team.name} + workspace labels`,
                           value: team.id,
                        })),
                     ]}
                     value={labelTeamFilter}
                     onChange={setLabelTeamFilter}
                  />
               </div>
               <div className="flex items-center gap-2">
                  <Button size="xs" variant="secondary" onClick={() => setIsGroupOpen(true)}>
                     New group
                  </Button>
                  <Button size="xs" onClick={() => setIsCreateOpen(true)}>
                     New label
                  </Button>
               </div>
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

            {/* Header */}
            <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground border-b">
               <div className="flex-1 min-w-0">Name ↓</div>
               <div className="hidden md:block w-[260px]">Description</div>
               <div className="w-[70px]">Issues</div>
               <div className="hidden sm:block w-[110px]">Last applied</div>
               <div className="w-[80px]">Created</div>
            </div>

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
                        <span className="text-[11px] text-muted-foreground shrink-0">
                           {label.teamId
                              ? (teams.find((team) => team.id === label.teamId)?.name ??
                                label.teamId)
                              : 'Workspace'}
                        </span>
                     </div>
                     <div className="hidden md:block w-[260px] text-xs text-muted-foreground truncate pr-4">
                        {label.description || '—'}
                     </div>
                     <div className="w-[70px] text-xs text-muted-foreground">
                        {label.issues > 0 && formatCount(label.issues)}
                     </div>
                     <div className="hidden sm:block w-[110px] text-xs text-muted-foreground">
                        {label.issues > 0 ? 'Tracked' : '—'}
                     </div>
                     <div className="w-[80px] text-xs text-muted-foreground">
                        {formatDate(label.createdAt)}
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
                              setEditLabelTeamId(label.teamId ?? 'workspace');
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
                           scope: editingLabel.scope ?? 'issue',
                           teamId: editLabelTeamId === 'workspace' ? null : editLabelTeamId,
                           groupId: editLabelGroupId || undefined,
                        },
                     });
                     setEditingLabel(null);
                  }}
               >
                  <DialogHeader>
                     <DialogTitle>Edit issue label</DialogTitle>
                     <DialogDescription>Update the label and reassign its group.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="edit-issue-label-name">Name</FormLabel>
                        <Input
                           id="edit-issue-label-name"
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
                        <FormLabel htmlFor="edit-issue-label-group">Group</FormLabel>
                        <select
                           id="edit-issue-label-group"
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
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="edit-issue-label-team">Team scope</FormLabel>
                        <select
                           id="edit-issue-label-team"
                           value={editLabelTeamId}
                           onChange={(event) => setEditLabelTeamId(event.target.value)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           <option value="workspace">Workspace (all teams)</option>
                           {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                 {team.name}
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
                           scope: 'issue',
                           mutuallyExclusive: editGroupMutuallyExclusive,
                        },
                     });
                     setEditingGroup(null);
                  }}
               >
                  <DialogHeader>
                     <DialogTitle>Edit issue label group</DialogTitle>
                     <DialogDescription>
                        Rename the group or change its selection rule.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-3">
                     <FormLabel htmlFor="edit-issue-label-group-name">Name</FormLabel>
                     <Input
                        id="edit-issue-label-group-name"
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
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="new-label-group">Group</FormLabel>
                        <select
                           id="new-label-group"
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
                     <div className="space-y-1.5">
                        <FormLabel htmlFor="new-label-team">Team scope</FormLabel>
                        <select
                           id="new-label-team"
                           value={newLabelTeamId}
                           onChange={(event) => setNewLabelTeamId(event.target.value)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           <option value="workspace">Workspace (all teams)</option>
                           {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                 {team.name}
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
                        scope: 'issue',
                        mutuallyExclusive: newGroupMutuallyExclusive,
                     });
                     setNewGroupName('');
                     setNewGroupMutuallyExclusive(false);
                     setIsGroupOpen(false);
                  }}
               >
                  <DialogHeader>
                     <DialogTitle>New label group</DialogTitle>
                     <DialogDescription>Group related issue labels together.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-1.5">
                     <FormLabel htmlFor="new-label-group-name">Name</FormLabel>
                     <Input
                        id="new-label-group-name"
                        value={newGroupName}
                        onChange={(event) => setNewGroupName(event.target.value)}
                        disabled={createLabelGroup.isPending}
                        autoFocus
                        required
                     />
                     <label className="flex items-center gap-2 text-sm pt-2">
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
