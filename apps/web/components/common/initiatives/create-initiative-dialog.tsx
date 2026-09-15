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
import { useCreateInitiative } from '@/hooks/queries/use-initiatives-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { useMembers } from '@/hooks/queries/use-members-query';
import { useLabels } from '@/hooks/queries/use-labels-query';
import { Check, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { renderPriorityIcon } from '@/lib/priority-utils';
import { useParams } from 'next/navigation';

interface CreateInitiativeDialogProps {
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

const INITIATIVE_EMOJIS = [
   '🧱',
   '🎯',
   '🚀',
   '⚡',
   '🎨',
   '📱',
   '📚',
   '🏆',
   '🏗️',
   '♿',
   '🌱',
   '🧪',
   '🛝',
   '🧺',
   '💡',
   '🔒',
];

const HEALTH_OPTIONS = [
   { id: 'on-track', name: 'On track', color: '#30a46c' },
   { id: 'at-risk', name: 'At risk', color: '#f76808' },
   { id: 'off-track', name: 'Off track', color: '#e5484d' },
   { id: 'no-update', name: 'No update', color: '#95a2b3' },
];

const PRIORITY_OPTIONS = [
   { id: 'no-priority', name: 'No priority' },
   { id: 'urgent', name: 'Urgent' },
   { id: 'high', name: 'High' },
   { id: 'medium', name: 'Medium' },
   { id: 'low', name: 'Low' },
];

export function CreateInitiativeDialog({
   trigger,
   open: controlledOpen,
   onOpenChange: setControlledOpen,
}: CreateInitiativeDialogProps) {
   const [internalOpen, setInternalOpen] = React.useState(false);
   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

   const createInitiativeMutation = useCreateInitiative();
   const { orgId } = useParams<{ orgId: string }>();
   const { data: projects = [] } = useProjects();
   const { data: members = [] } = useMembers();
   const { data: labels = [] } = useLabels('project');

   const [name, setName] = React.useState('');
   const [selectedIcon, setSelectedIcon] = React.useState('🧱');
   const [status, setStatus] = React.useState<'active' | 'planned' | 'completed'>('active');
   const [ownerId, setOwnerId] = React.useState('');
   const [target, setTarget] = React.useState('Q4 2026');
   const [priorityId, setPriorityId] = React.useState('no-priority');
   const [healthId, setHealthId] = React.useState('on-track');
   const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
   const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);
   const [resourcesText, setResourcesText] = React.useState('');
   const [description, setDescription] = React.useState('');
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   // Initiative ownership is optional; never assign an arbitrary member.
   React.useEffect(() => {
      if (ownerId && !members.some((member) => member.id === ownerId)) setOwnerId('');
   }, [members, ownerId]);

   const toggleProject = (projectId: string) => {
      setSelectedProjectIds((prev) =>
         prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
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
         toast.error('Please enter an initiative name');
         return;
      }

      setIsSubmitting(true);
      try {
         const resources = resourcesText
            .split('\n')
            .map((line) => {
               const [label, ...urlParts] = line.split('|').map((part) => part.trim());
               return { label, url: urlParts.join('|') };
            })
            .filter((resource) => resource.label && resource.url);
         const payload = {
            name: trimmedName,
            workspaceId: orgId,
            description: description.trim() || undefined,
            icon: selectedIcon,
            status,
            ownerId: ownerId || undefined,
            target: target.trim() || undefined,
            priorityId,
            healthId,
            projectIds: selectedProjectIds,
            labelIds: selectedLabelIds,
            resources,
         };
         await createInitiativeMutation.mutateAsync(payload);

         toast.success(`Initiative "${trimmedName}" created successfully`);
         setName('');
         setDescription('');
         setSelectedProjectIds([]);
         setSelectedLabelIds([]);
         setResourcesText('');
         setOpen(false);
      } catch (err: unknown) {
         console.error('Failed to create initiative:', err);
         const errorMessage = err instanceof Error ? err.message : 'Could not create initiative';
         toast.error(errorMessage);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         {trigger ? (
            <DialogTrigger asChild>{trigger}</DialogTrigger>
         ) : (
            <DialogTrigger asChild>
               <Button className="relative" size="xs" variant="secondary">
                  <Plus className="size-4 mr-1" />
                  Create initiative
               </Button>
            </DialogTrigger>
         )}
         <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-container border-border/60">
            <form onSubmit={handleSubmit}>
               <DialogHeader className="p-5 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                     <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {selectedIcon}
                     </div>
                     <div>
                        <DialogTitle className="text-base font-semibold">
                           Create initiative
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                           Initiatives coordinate multiple cross-team projects toward long-term
                           company goals.
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>

               <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {/* Name */}
                  <div className="space-y-1.5">
                     <Label htmlFor="init-name" className="text-xs font-medium">
                        Initiative name <span className="text-destructive">*</span>
                     </Label>
                     <Input
                        id="init-name"
                        placeholder="e.g. Q4 — Ship the Next-Gen Component Platform"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        required
                        autoFocus
                        className="h-9 text-sm"
                     />
                  </div>

                  {/* Icon grid */}
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium">Icon</Label>
                     <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border/40 bg-background/50">
                        {INITIATIVE_EMOJIS.map((emoji) => (
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

                  {/* Status, Target Quarter, Owner row */}
                  <div className="grid grid-cols-3 gap-2.5">
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Status</Label>
                        <Select
                           value={status}
                           onValueChange={(v: 'active' | 'planned' | 'completed') => setStatus(v)}
                           disabled={isSubmitting}
                        >
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              <SelectItem value="active" className="text-xs">
                                 Active
                              </SelectItem>
                              <SelectItem value="planned" className="text-xs">
                                 Planned
                              </SelectItem>
                              <SelectItem value="completed" className="text-xs">
                                 Completed
                              </SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-1.5">
                        <Label htmlFor="init-target" className="text-xs font-medium">
                           Target quarter
                        </Label>
                        <Input
                           id="init-target"
                           placeholder="e.g. Q4 2026"
                           value={target}
                           onChange={(e) => setTarget(e.target.value)}
                           disabled={isSubmitting}
                           className="h-8 text-xs"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Owner</Label>
                        <Select value={ownerId} onValueChange={setOwnerId} disabled={isSubmitting}>
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              {members.map((m) => (
                                 <SelectItem key={m.id} value={m.id} className="text-xs">
                                    <div className="flex items-center gap-1.5">
                                       <Avatar className="size-4">
                                          <AvatarImage src={m.avatarUrl} alt={m.name} />
                                          <AvatarFallback className="text-[8px]">
                                             {m.name.slice(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                       </Avatar>
                                       <span className="truncate">{m.name}</span>
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  {/* Priority & Health row */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Priority</Label>
                        <Select
                           value={priorityId}
                           onValueChange={setPriorityId}
                           disabled={isSubmitting}
                        >
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              {PRIORITY_OPTIONS.map((p) => (
                                 <SelectItem key={p.id} value={p.id} className="text-xs">
                                    <div className="flex items-center gap-1.5">
                                       {renderPriorityIcon(p.id, 'size-3.5')}
                                       <span>{p.name}</span>
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Health</Label>
                        <Select
                           value={healthId}
                           onValueChange={setHealthId}
                           disabled={isSubmitting}
                        >
                           <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              {HEALTH_OPTIONS.map((h) => (
                                 <SelectItem key={h.id} value={h.id} className="text-xs">
                                    <div className="flex items-center gap-1.5">
                                       <span
                                          className="size-2 rounded-full"
                                          style={{ backgroundColor: h.color }}
                                       />
                                       <span>{h.name}</span>
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  {/* Associated projects */}
                  {projects.length > 0 && (
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium flex items-center justify-between">
                           <span>Associated projects</span>
                           <span className="text-[11px] text-muted-foreground font-normal">
                              {selectedProjectIds.length} linked
                           </span>
                        </Label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1">
                           {projects.map((proj) => {
                              const isSelected = selectedProjectIds.includes(proj.id);
                              return (
                                 <button
                                    key={proj.id}
                                    type="button"
                                    onClick={() => toggleProject(proj.id)}
                                    className={cn(
                                       'flex items-center gap-2 p-1.5 rounded-md border text-xs text-left transition-all',
                                       isSelected
                                          ? 'border-primary bg-primary/10 text-foreground font-medium'
                                          : 'border-border/40 hover:bg-sidebar/50 text-muted-foreground'
                                    )}
                                 >
                                    <span className="truncate flex-1">{proj.name}</span>
                                    {isSelected && (
                                       <Check className="size-3 text-primary shrink-0" />
                                    )}
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  )}

                  {/* Initiative labels */}
                  {labels.length > 0 && (
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium flex items-center justify-between">
                           <span>Labels</span>
                           <span className="text-[11px] text-muted-foreground font-normal">
                              {selectedLabelIds.length} selected
                           </span>
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                           {labels.map((label) => {
                              const isSelected = selectedLabelIds.includes(label.id);
                              return (
                                 <button
                                    key={label.id}
                                    type="button"
                                    onClick={() => toggleLabel(label.id)}
                                    className={cn(
                                       'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all',
                                       isSelected
                                          ? 'border-primary bg-primary/10 text-foreground'
                                          : 'border-border/50 text-muted-foreground hover:bg-sidebar/50'
                                    )}
                                 >
                                    <span
                                       className="size-2 rounded-full"
                                       style={{ backgroundColor: label.color }}
                                    />
                                    {label.name}
                                    {isSelected && <Check className="size-3 text-primary" />}
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  )}

                  {/* Resources */}
                  <div className="space-y-1.5">
                     <Label htmlFor="init-resources" className="text-xs font-medium">
                        Resources (optional)
                     </Label>
                     <Textarea
                        id="init-resources"
                        placeholder="Design brief | https://example.com/brief\nRoadmap | https://example.com/roadmap"
                        value={resourcesText}
                        onChange={(e) => setResourcesText(e.target.value)}
                        disabled={isSubmitting}
                        rows={2}
                        className="text-xs resize-none"
                     />
                     <p className="text-[11px] text-muted-foreground">
                        One resource per line using <code>label | URL</code>.
                     </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                     <Label htmlFor="init-desc" className="text-xs font-medium">
                        Description (optional)
                     </Label>
                     <Textarea
                        id="init-desc"
                        placeholder="High-level initiative goals and scope..."
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
                           Creating...
                        </>
                     ) : (
                        'Create initiative'
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
