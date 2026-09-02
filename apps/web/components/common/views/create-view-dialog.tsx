'use client';

import * as React from 'react';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { useCreateView, useUpdateView } from '@/hooks/queries/use-views-query';
import { useTeams } from '@/hooks/queries/use-teams-query';
import { useLabels } from '@/hooks/queries/use-labels-query';
import { Check, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { View, ViewType } from '@/mock-data/views';
import { StatusCategory } from '@/mock-data/status';
import { renderPriorityIcon } from '@/lib/priority-utils';

interface CreateViewDialogProps {
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   defaultTeamId?: string;
   /** When provided, the dialog edits this existing view instead of creating a new one. */
   editingView?: View;
}

const VIEW_EMOJIS = [
   '🧊',
   '⏱️',
   '⌛',
   '💬',
   '⚡',
   '🧪',
   '🐞',
   '🔄',
   '🫥',
   '📝',
   '🔐',
   '🏆',
   '🗂️',
   '📦',
   '🛠️',
   '🎨',
   '🌐',
   '📱',
];

const STATUS_CATEGORIES = [
   { id: 'backlog', label: 'Backlog' },
   { id: 'unstarted', label: 'Unstarted / Planned' },
   { id: 'started', label: 'In Progress' },
   { id: 'completed', label: 'Completed' },
   { id: 'canceled', label: 'Canceled' },
];

const PRIORITIES = [
   { id: 'urgent', name: 'Urgent' },
   { id: 'high', name: 'High' },
   { id: 'medium', name: 'Medium' },
   { id: 'low', name: 'Low' },
   { id: 'no-priority', name: 'No priority' },
];

export function CreateViewDialog({
   trigger,
   open: controlledOpen,
   onOpenChange: setControlledOpen,
   defaultTeamId,
   editingView,
}: CreateViewDialogProps) {
   const [internalOpen, setInternalOpen] = React.useState(false);
   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? setControlledOpen! : setInternalOpen;
   const isEditing = Boolean(editingView);

   const createViewMutation = useCreateView();
   const updateViewMutation = useUpdateView();
   const { data: teams = [] } = useTeams();
   const { data: labels = [] } = useLabels();

   const [name, setName] = React.useState('');
   const [selectedIcon, setSelectedIcon] = React.useState('🧊');
   const [viewType, setViewType] = React.useState<ViewType>('issue');
   const [teamScope, setTeamScope] = React.useState<string>(defaultTeamId || 'all');
   const [selectedCategories, setSelectedCategories] = React.useState<string[]>(['started']);
   const [selectedPriorities, setSelectedPriorities] = React.useState<string[]>([]);
   const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);
   const [hasProjectOnly, setHasProjectOnly] = React.useState(false);
   const [unassignedOnly, setUnassignedOnly] = React.useState(false);
   const [assignedToMe, setAssignedToMe] = React.useState(false);
   const [description, setDescription] = React.useState('');
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   // Sync defaultTeamId if supplied
   React.useEffect(() => {
      if (defaultTeamId) setTeamScope(defaultTeamId);
   }, [defaultTeamId]);

   // Prefill form when opening in edit mode
   React.useEffect(() => {
      if (open && editingView) {
         setName(editingView.name);
         setSelectedIcon(editingView.icon);
         setViewType(editingView.type);
         setTeamScope(editingView.teamId || 'all');
         setSelectedCategories(editingView.filter.statusCategories || []);
         setSelectedPriorities(editingView.filter.priorityIds || []);
         setSelectedLabelIds(editingView.filter.labelIds || []);
         setHasProjectOnly(Boolean(editingView.filter.hasProject));
         setUnassignedOnly(Boolean(editingView.filter.unassigned));
         setAssignedToMe(editingView.filter.assigneeId === 'me');
         setDescription(editingView.description || '');
      }
   }, [open, editingView]);

   const toggleCategory = (catId: string) => {
      setSelectedCategories((prev) =>
         prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
      );
   };

   const togglePriority = (pId: string) => {
      setSelectedPriorities((prev) =>
         prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
      );
   };

   const toggleLabel = (labelId: string) => {
      setSelectedLabelIds((prev) =>
         prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
      );
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
         toast.error('Please enter a view name');
         return;
      }

      setIsSubmitting(true);
      try {
         const payload = {
            name: trimmedName,
            description: description.trim() || undefined,
            icon: selectedIcon,
            type: viewType,
            teamId: teamScope !== 'all' ? teamScope : undefined,
            filter: {
               statusCategories:
                  selectedCategories.length > 0
                     ? (selectedCategories as StatusCategory[])
                     : undefined,
               priorityIds: selectedPriorities.length > 0 ? selectedPriorities : undefined,
               labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
               hasProject: hasProjectOnly ? true : undefined,
               unassigned: unassignedOnly ? true : undefined,
               assigneeId: assignedToMe ? 'me' : undefined,
            },
         };

         if (isEditing && editingView) {
            await updateViewMutation.mutateAsync({ id: editingView.id, payload });
         } else {
            const viewId = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await createViewMutation.mutateAsync({ id: viewId, ...payload });
            toast.success(`View "${trimmedName}" created successfully`);
            setName('');
            setDescription('');
            setSelectedCategories(['started']);
            setSelectedPriorities([]);
            setSelectedLabelIds([]);
            setHasProjectOnly(false);
            setUnassignedOnly(false);
            setAssignedToMe(false);
         }
         setOpen(false);
      } catch (err: unknown) {
         console.error(`Failed to ${isEditing ? 'update' : 'create'} view:`, err);
         const errorMessage =
            err instanceof Error
               ? err.message
               : `Could not ${isEditing ? 'update' : 'create'} view`;
         toast.error(errorMessage);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         {trigger ? (
            <DialogTrigger asChild>{trigger}</DialogTrigger>
         ) : !isEditing ? (
            <DialogTrigger asChild>
               <Button className="relative" size="xs" variant="secondary">
                  <Plus className="size-4 mr-1" />
                  Create view
               </Button>
            </DialogTrigger>
         ) : null}
         <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden bg-container border-border/60">
            <form onSubmit={handleSubmit}>
               <DialogHeader className="p-5 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                     <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {selectedIcon}
                     </div>
                     <div>
                        <DialogTitle className="text-base font-semibold">
                           {isEditing ? 'Edit view' : 'Create custom view'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                           Save custom filters across issues and projects for fast daily access.
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>

               <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {/* Name & Type */}
                  <div className="space-y-1.5">
                     <Label htmlFor="view-name" className="text-xs font-medium">
                        View name <span className="text-destructive">*</span>
                     </Label>
                     <Input
                        id="view-name"
                        placeholder="e.g. Active High-Priority Blockers"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        required
                        autoFocus
                        className="h-9 text-sm"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     {/* View Type */}
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Type</Label>
                        <Select
                           value={viewType}
                           onValueChange={(v: ViewType) => setViewType(v)}
                           disabled={isSubmitting}
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              <SelectItem value="issue" className="text-xs">
                                 Issues View
                              </SelectItem>
                              <SelectItem value="project" className="text-xs">
                                 Projects View
                              </SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Scope / Team */}
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Scope</Label>
                        <Select
                           value={teamScope}
                           onValueChange={setTeamScope}
                           disabled={isSubmitting}
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              <SelectItem value="all" className="text-xs">
                                 All workspace
                              </SelectItem>
                              {teams.map((t) => (
                                 <SelectItem key={t.id} value={t.id} className="text-xs">
                                    {t.icon} {t.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  {/* Icon grid */}
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium">Icon</Label>
                     <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border/40 bg-background/50">
                        {VIEW_EMOJIS.map((emoji) => (
                           <button
                              key={emoji}
                              type="button"
                              onClick={() => setSelectedIcon(emoji)}
                              className={cn(
                                 'size-8 rounded-md flex items-center justify-center text-base transition-all',
                                 selectedIcon === emoji
                                    ? 'bg-primary/20 ring-2 ring-primary scale-110'
                                    : 'hover:bg-sidebar/80'
                              )}
                           >
                              {emoji}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Status categories filter */}
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium">Filter by status category</Label>
                     <div className="flex flex-wrap gap-1.5">
                        {STATUS_CATEGORIES.map((cat) => {
                           const isSelected = selectedCategories.includes(cat.id);
                           return (
                              <button
                                 key={cat.id}
                                 type="button"
                                 onClick={() => toggleCategory(cat.id)}
                                 className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all',
                                    isSelected
                                       ? 'border-primary bg-primary/15 text-foreground font-medium'
                                       : 'border-border/40 hover:bg-sidebar/50 text-muted-foreground'
                                 )}
                              >
                                 <span>{cat.label}</span>
                                 {isSelected && <Check className="size-3 text-primary" />}
                              </button>
                           );
                        })}
                     </div>
                  </div>

                  {/* Priority filter */}
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium">Filter by priority</Label>
                     <div className="flex flex-wrap gap-1.5">
                        {PRIORITIES.map((p) => {
                           const isSelected = selectedPriorities.includes(p.id);
                           return (
                              <button
                                 key={p.id}
                                 type="button"
                                 onClick={() => togglePriority(p.id)}
                                 className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all',
                                    isSelected
                                       ? 'border-primary bg-primary/15 text-foreground font-medium'
                                       : 'border-border/40 hover:bg-sidebar/50 text-muted-foreground'
                                 )}
                              >
                                 {renderPriorityIcon(p.id, 'size-3.5')}
                                 <span>{p.name}</span>
                                 {isSelected && <Check className="size-3 text-primary" />}
                              </button>
                           );
                        })}
                     </div>
                  </div>

                  {/* Labels (for issue views) */}
                  {viewType === 'issue' && labels.length > 0 && (
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Filter by labels</Label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                           {labels.map((lbl) => {
                              const isSelected = selectedLabelIds.includes(lbl.id);
                              return (
                                 <button
                                    key={lbl.id}
                                    type="button"
                                    onClick={() => toggleLabel(lbl.id)}
                                    className={cn(
                                       'flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] transition-all',
                                       isSelected
                                          ? 'border-primary bg-primary/15 text-foreground font-medium'
                                          : 'border-border/40 hover:bg-sidebar/50 text-muted-foreground'
                                    )}
                                 >
                                    <span
                                       className="size-2 rounded-full"
                                       style={{ backgroundColor: lbl.color }}
                                    />
                                    <span>{lbl.name}</span>
                                    {isSelected && <Check className="size-3 text-primary" />}
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  )}

                  {/* Toggle flags */}
                  <div className="flex items-center gap-4 pt-1">
                     <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                           type="checkbox"
                           checked={hasProjectOnly}
                           onChange={(e) => setHasProjectOnly(e.target.checked)}
                           className="rounded border-border"
                        />
                        Has project only
                     </label>
                     {viewType === 'issue' && (
                        <>
                           <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                              <input
                                 type="checkbox"
                                 checked={assignedToMe}
                                 onChange={(e) => {
                                    setAssignedToMe(e.target.checked);
                                    if (e.target.checked) setUnassignedOnly(false);
                                 }}
                                 className="rounded border-border"
                              />
                              Assigned to me
                           </label>
                           <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                              <input
                                 type="checkbox"
                                 checked={unassignedOnly}
                                 onChange={(e) => {
                                    setUnassignedOnly(e.target.checked);
                                    if (e.target.checked) setAssignedToMe(false);
                                 }}
                                 className="rounded border-border"
                              />
                              Unassigned only
                           </label>
                        </>
                     )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                     <Label htmlFor="view-desc" className="text-xs font-medium">
                        Description (optional)
                     </Label>
                     <Textarea
                        id="view-desc"
                        placeholder="Purpose of this view..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                        rows={2}
                        className="text-xs resize-none"
                     />
                  </div>
               </div>

               <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2">
                  <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => setOpen(false)}
                     disabled={isSubmitting}
                     className="h-8 text-xs"
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     size="sm"
                     disabled={isSubmitting || !name.trim()}
                     className="h-8 text-xs gap-1.5"
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="size-3.5 animate-spin" />
                           {isEditing ? 'Saving...' : 'Creating...'}
                        </>
                     ) : isEditing ? (
                        'Save changes'
                     ) : (
                        'Create view'
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
