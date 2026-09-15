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
import { Textarea } from '@/components/ui/textarea';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import {
   useIssueTemplates,
   useCreateIssueTemplate,
   useDeleteIssueTemplate,
   useDuplicateIssueTemplate,
   useUpdateIssueTemplate,
} from '@/hooks/queries/use-issue-templates-query';
import { useLabels } from '@/hooks/queries/use-labels-query';
import { useMembers } from '@/hooks/queries/use-members-query';
import { useTeams } from '@/hooks/queries/use-teams-query';
import type { CreateIssueTemplatePayload, IssueTemplate } from '@/services/issue-templates.service';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const statuses = [
   ['triage', 'Triage'],
   ['to-do', 'Todo'],
   ['in-progress', 'In Progress'],
   ['done', 'Done'],
];
const priorities = [
   ['no-priority', 'No priority'],
   ['urgent', 'Urgent'],
   ['high', 'High'],
   ['medium', 'Medium'],
   ['low', 'Low'],
];
const categoryFor = (id: string) =>
   id === 'done'
      ? 'completed'
      : id === 'triage'
        ? 'triage'
        : id === 'in-progress'
          ? 'started'
          : 'unstarted';

type EditorProps = {
   open: boolean;
   template: IssueTemplate | null;
   workspaceId: string;
   teams: Array<{ id: string; name: string }>;
   members: Array<{ id: string; name: string }>;
   labels: Array<{ id: string; name: string; color: string }>;
   onClose: (open: boolean) => void;
   onCreate: (payload: CreateIssueTemplatePayload) => Promise<void>;
   onUpdate: (id: string, payload: Partial<CreateIssueTemplatePayload>) => Promise<void>;
};

function TemplateEditor({
   open,
   template,
   workspaceId,
   teams,
   members,
   labels,
   onClose,
   onCreate,
   onUpdate,
}: EditorProps) {
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const [scope, setScope] = useState<'workspace' | 'team'>('workspace');
   const [teamId, setTeamId] = useState('');
   const [title, setTitle] = useState('');
   const [issueDescription, setIssueDescription] = useState('');
   const [statusId, setStatusId] = useState('to-do');
   const [priorityId, setPriorityId] = useState('no-priority');
   const [assigneeId, setAssigneeId] = useState('none');
   const [labelIds, setLabelIds] = useState<string[]>([]);
   const [isDefault, setIsDefault] = useState(false);

   useEffect(() => {
      if (!open) return;
      const config = template?.config ?? {};
      setName(template?.name ?? '');
      setDescription(template?.description ?? '');
      setScope(template?.scope ?? 'workspace');
      setTeamId(template?.teamId ?? '');
      setTitle(config.title ?? '');
      setIssueDescription(config.description ?? '');
      setStatusId(config.statusId ?? 'to-do');
      setPriorityId(config.priorityId ?? 'no-priority');
      setAssigneeId(config.assigneeId ?? 'none');
      setLabelIds(config.labelIds ?? []);
      setIsDefault(template?.isDefault ?? false);
   }, [open, template, teams]);

   const toggleLabel = (id: string) =>
      setLabelIds((current) =>
         current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      );
   const submit = async (event: FormEvent) => {
      event.preventDefault();
      const payload = {
         workspaceId,
         name: name.trim(),
         description: description.trim() || undefined,
         scope,
         teamId: scope === 'team' ? teamId : undefined,
         isDefault,
         config: {
            title: title.trim() || undefined,
            description: issueDescription || undefined,
            statusId,
            statusCategory: categoryFor(statusId),
            priorityId,
            assigneeId: assigneeId === 'none' ? undefined : assigneeId,
            labelIds,
         },
      } satisfies CreateIssueTemplatePayload;
      if (template) await onUpdate(template.id, payload);
      else await onCreate(payload);
   };

   return (
      <Dialog open={open} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={submit}>
               <DialogHeader>
                  <DialogTitle>
                     {template ? 'Edit issue template' : 'New issue template'}
                  </DialogTitle>
                  <DialogDescription>
                     Save real issue defaults for workspace or team issue creation.
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                  <Input
                     placeholder="Template name"
                     value={name}
                     onChange={(event) => setName(event.target.value)}
                     required
                     autoFocus
                  />
                  <Textarea
                     placeholder="Template description"
                     value={description}
                     onChange={(event) => setDescription(event.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                     <Select
                        value={scope}
                        onValueChange={(value: 'workspace' | 'team') => setScope(value)}
                     >
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="workspace">Workspace</SelectItem>
                           <SelectItem value="team">Team</SelectItem>
                        </SelectContent>
                     </Select>
                     {scope === 'team' && (
                        <Select value={teamId} onValueChange={setTeamId}>
                           <SelectTrigger>
                              <SelectValue placeholder="Team" />
                           </SelectTrigger>
                           <SelectContent>
                              {teams.map((team) => (
                                 <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     )}
                  </div>
                  <Input
                     placeholder="Default issue title"
                     value={title}
                     onChange={(event) => setTitle(event.target.value)}
                  />
                  <Textarea
                     placeholder="Default issue description"
                     value={issueDescription}
                     onChange={(event) => setIssueDescription(event.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                     <Select value={statusId} onValueChange={setStatusId}>
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {statuses.map(([id, label]) => (
                              <SelectItem key={id} value={id}>
                                 {label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <Select value={priorityId} onValueChange={setPriorityId}>
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {priorities.map(([id, label]) => (
                              <SelectItem key={id} value={id}>
                                 {label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <Select value={assigneeId} onValueChange={setAssigneeId}>
                        <SelectTrigger>
                           <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="none">No assignee</SelectItem>
                           {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                 {member.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <p className="text-sm font-medium mb-2">Default labels</p>
                     <div className="flex flex-wrap gap-2">
                        {labels.map((label) => (
                           <Button
                              type="button"
                              key={label.id}
                              size="xs"
                              variant={labelIds.includes(label.id) ? 'default' : 'outline'}
                              onClick={() => toggleLabel(label.id)}
                           >
                              {label.name}
                           </Button>
                        ))}
                     </div>
                  </div>
                  {scope === 'team' && (
                     <label className="flex items-center gap-2 text-sm">
                        <input
                           type="checkbox"
                           checked={isDefault}
                           onChange={(event) => setIsDefault(event.target.checked)}
                        />
                        Default template for this team
                     </label>
                  )}
               </div>
               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => onClose(false)}>
                     Cancel
                  </Button>
                  <Button type="submit" disabled={!name.trim() || (scope === 'team' && !teamId)}>
                     {template ? 'Save changes' : 'Create template'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}

export default function IssueTemplatesSettings() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: templates = [], isLoading, isError } = useIssueTemplates(orgId);
   const { data: teams = [] } = useTeams();
   const { data: members = [] } = useMembers();
   const { data: labels = [] } = useLabels('issue');
   const create = useCreateIssueTemplate();
   const update = useUpdateIssueTemplate();
   const duplicate = useDuplicateIssueTemplate();
   const remove = useDeleteIssueTemplate();
   const [filter, setFilter] = useState('');
   const [editing, setEditing] = useState<IssueTemplate | null>(null);
   const [open, setOpen] = useState(false);
   const rows = useMemo(
      () => templates.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase())),
      [templates, filter]
   );
   return (
      <div className="w-full overflow-y-auto h-full">
         <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
            <h1 className="text-2xl font-medium mb-2">Issue templates</h1>
            <p className="text-sm text-muted-foreground mb-6">
               Create reusable issue defaults for every workspace or a specific team.
            </p>
            <div className="flex justify-between gap-3 mb-6">
               <Input
                  className="w-64 h-8"
                  placeholder="Filter by name..."
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
               />
               <Button
                  size="xs"
                  onClick={() => {
                     setEditing(null);
                     setOpen(true);
                  }}
               >
                  New template
               </Button>
            </div>
            {isError && (
               <p className="text-sm text-destructive py-6">Could not load issue templates.</p>
            )}
            {isLoading && (
               <p className="text-sm text-muted-foreground py-6">Loading templates...</p>
            )}
            {!isLoading && !isError && (
               <div className="space-y-6">
                  {(['workspace', 'team'] as const).map((scope) => {
                     const scoped = rows.filter((item) => item.scope === scope);
                     return (
                        <section key={scope}>
                           <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                              {scope === 'workspace' ? 'Workspace templates' : 'Team templates'}
                           </h2>
                           <div className="border rounded-lg overflow-hidden">
                              {scoped.map((item) => (
                                 <div
                                    key={item.id}
                                    className="flex items-center gap-3 px-3 py-3 border-b last:border-b-0"
                                 >
                                    <div className="flex-1 min-w-0">
                                       <div className="font-medium truncate">
                                          {item.name}
                                          {item.isDefault && (
                                             <span className="ml-2 text-xs text-primary">
                                                Default
                                             </span>
                                          )}
                                       </div>
                                       <div className="text-xs text-muted-foreground truncate">
                                          {item.description || 'No description'}
                                          {item.scope === 'team' &&
                                             ` · ${teams.find((team) => team.id === item.teamId)?.name ?? item.teamId}`}
                                       </div>
                                    </div>
                                    <Button
                                       size="xs"
                                       variant="ghost"
                                       onClick={() => {
                                          setEditing(item);
                                          setOpen(true);
                                       }}
                                    >
                                       Edit
                                    </Button>
                                    <Button
                                       size="xs"
                                       variant="ghost"
                                       onClick={() => duplicate.mutate(item.id)}
                                    >
                                       Duplicate
                                    </Button>
                                    <Button
                                       size="xs"
                                       variant="ghost"
                                       className="text-destructive"
                                       onClick={() => {
                                          if (window.confirm(`Delete template "${item.name}"?`))
                                             remove.mutate(item.id);
                                       }}
                                    >
                                       Delete
                                    </Button>
                                 </div>
                              ))}
                              {scoped.length === 0 && (
                                 <p className="text-sm text-muted-foreground px-3 py-5">
                                    No {scope} templates.
                                 </p>
                              )}
                           </div>
                        </section>
                     );
                  })}
               </div>
            )}
         </div>
         <TemplateEditor
            open={open}
            onClose={setOpen}
            workspaceId={orgId}
            template={editing}
            teams={teams}
            members={members}
            labels={labels}
            onCreate={async (payload) => {
               await create.mutateAsync(payload);
               setOpen(false);
            }}
            onUpdate={async (id, payload) => {
               await update.mutateAsync({ id, payload });
               setOpen(false);
            }}
         />
      </div>
   );
}
