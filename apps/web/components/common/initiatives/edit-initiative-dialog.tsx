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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMembers } from '@/hooks/queries/use-members-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { useLabels } from '@/hooks/queries/use-labels-query';
import { useUpdateInitiative } from '@/hooks/queries/use-initiatives-query';
import QueryErrorState from '@/components/common/query-error-state';
import type { Initiative, InitiativeStatus } from '@/services/initiatives.service';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type InitiativeHealth = 'no-update' | 'on-track' | 'at-risk' | 'off-track';

const parseResources = (value: string) =>
   value
      .split('\n')
      .map((line) => {
         const [label, ...urlParts] = line.split('|').map((part) => part.trim());
         return { label, url: urlParts.join('|') };
      })
      .filter((resource) => resource.label && resource.url);

export function EditInitiativeDialog({
   initiative,
   open,
   onOpenChange,
}: {
   initiative: Initiative;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const updateInitiative = useUpdateInitiative();
   const membersQuery = useMembers();
   const projectsQuery = useProjects();
   const labelsQuery = useLabels('project');
   const { data: members = [] } = membersQuery;
   const { data: projects = [] } = projectsQuery;
   const { data: labels = [] } = labelsQuery;
   const optionError = [membersQuery, projectsQuery, labelsQuery].find((query) => query.isError);
   const [name, setName] = useState(initiative.name);
   const [description, setDescription] = useState(initiative.description ?? '');
   const [status, setStatus] = useState<InitiativeStatus>(initiative.status);
   const [priorityId, setPriorityId] = useState(initiative.priority.id);
   const [healthId, setHealthId] = useState<InitiativeHealth>(
      initiative.health.id as InitiativeHealth
   );
   const [ownerId, setOwnerId] = useState(initiative.owner?.id ?? 'none');
   const [target, setTarget] = useState(initiative.target ?? '');
   const [projectIds, setProjectIds] = useState<string[]>(initiative.projectIds);
   const [labelIds, setLabelIds] = useState<string[]>(initiative.labels.map((label) => label.id));
   const [resourcesText, setResourcesText] = useState(
      initiative.resources.map((resource) => `${resource.label} | ${resource.url}`).join('\n')
   );

   useEffect(() => {
      if (!open) return;
      setName(initiative.name);
      setDescription(initiative.description ?? '');
      setStatus(initiative.status);
      setPriorityId(initiative.priority.id);
      setHealthId(initiative.health.id as InitiativeHealth);
      setOwnerId(initiative.owner?.id ?? 'none');
      setTarget(initiative.target ?? '');
      setProjectIds(initiative.projectIds);
      setLabelIds(initiative.labels.map((label) => label.id));
      setResourcesText(
         initiative.resources.map((resource) => `${resource.label} | ${resource.url}`).join('\n')
      );
   }, [initiative, open]);

   const toggle = (id: string, setter: (value: (current: string[]) => string[]) => void) =>
      setter((current) =>
         current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      );

   const submit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (optionError) return;
      const trimmedName = name.trim();
      if (!trimmedName) return;
      await updateInitiative.mutateAsync({
         id: initiative.id,
         payload: {
            name: trimmedName,
            description: description.trim() || null,
            status,
            priorityId,
            healthId,
            ownerId: ownerId === 'none' ? null : ownerId,
            target: target.trim() || null,
            projectIds,
            labelIds,
            resources: parseResources(resourcesText),
         },
      });
      onOpenChange(false);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={submit}>
               <DialogHeader>
                  <DialogTitle>Edit initiative</DialogTitle>
                  <DialogDescription>
                     Update initiative properties and its live project, label, and resource links.
                  </DialogDescription>
                  {optionError && (
                     <QueryErrorState
                        subject="initiative options"
                        error={optionError.error}
                        onRetry={() => void optionError.refetch()}
                        compact
                     />
                  )}
               </DialogHeader>
               <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                     <Label htmlFor="edit-initiative-name">Name</Label>
                     <Input
                        id="edit-initiative-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={updateInitiative.isPending}
                        autoFocus
                        required
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label>Status</Label>
                        <select
                           value={status}
                           onChange={(event) => setStatus(event.target.value as InitiativeStatus)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           <option value="active">Active</option>
                           <option value="planned">Planned</option>
                           <option value="completed">Completed</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <select
                           value={priorityId}
                           onChange={(event) => setPriorityId(event.target.value)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           {['no-priority', 'urgent', 'high', 'medium', 'low'].map((id) => (
                              <option key={id} value={id}>
                                 {id === 'no-priority'
                                    ? 'No priority'
                                    : id[0].toUpperCase() + id.slice(1)}
                              </option>
                           ))}
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label>Health</Label>
                        <select
                           value={healthId}
                           onChange={(event) => setHealthId(event.target.value as InitiativeHealth)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           <option value="on-track">On track</option>
                           <option value="at-risk">At risk</option>
                           <option value="off-track">Off track</option>
                           <option value="no-update">No update</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <Label>Owner</Label>
                        <select
                           value={ownerId}
                           onChange={(event) => setOwnerId(event.target.value)}
                           className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                           <option value="none">No owner</option>
                           {members.map((member) => (
                              <option key={member.id} value={member.id}>
                                 {member.name}
                              </option>
                           ))}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label htmlFor="edit-initiative-target">Target</Label>
                     <Input
                        id="edit-initiative-target"
                        value={target}
                        onChange={(event) => setTarget(event.target.value)}
                        placeholder="Q4 2026"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <Label htmlFor="edit-initiative-description">Description</Label>
                     <Textarea
                        id="edit-initiative-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={3}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <Label>Projects</Label>
                     <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {projects.map((project) => (
                           <button
                              key={project.id}
                              type="button"
                              onClick={() => toggle(project.id, setProjectIds)}
                              className={cn(
                                 'rounded-md border px-2 py-1 text-xs',
                                 projectIds.includes(project.id)
                                    ? 'border-primary bg-primary/10'
                                    : 'text-muted-foreground hover:bg-accent'
                              )}
                           >
                              {project.name}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label>Labels</Label>
                     <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {labels.map((label) => (
                           <button
                              key={label.id}
                              type="button"
                              onClick={() => toggle(label.id, setLabelIds)}
                              className={cn(
                                 'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs',
                                 labelIds.includes(label.id)
                                    ? 'border-primary bg-primary/10'
                                    : 'text-muted-foreground hover:bg-accent'
                              )}
                           >
                              <span
                                 className="size-2 rounded-full"
                                 style={{ backgroundColor: label.color }}
                              />
                              {label.name}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label htmlFor="edit-initiative-resources">Resources</Label>
                     <Textarea
                        id="edit-initiative-resources"
                        value={resourcesText}
                        onChange={(event) => setResourcesText(event.target.value)}
                        placeholder="Brief | https://example.com/brief"
                        rows={3}
                     />
                     <p className="text-[11px] text-muted-foreground">
                        One resource per line using <code>label | URL</code>.
                     </p>
                  </div>
               </div>
               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     disabled={updateInitiative.isPending || !name.trim() || Boolean(optionError)}
                  >
                     {updateInitiative.isPending ? 'Saving...' : 'Save changes'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
