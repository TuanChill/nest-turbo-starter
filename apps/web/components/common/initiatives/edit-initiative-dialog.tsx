'use client';

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
import { Textarea } from '@/components/ui/textarea';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { useMembers } from '@/hooks/queries/use-members-query';
import { useUpdateInitiative } from '@/hooks/queries/use-initiatives-query';
import type { Initiative } from '@/services/initiatives.service';
import { useEffect, useState } from 'react';

export function EditInitiativeDialog({
   initiative,
   open,
   onOpenChange,
}: {
   initiative: Initiative;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const { data: members = [] } = useMembers();
   const updateMutation = useUpdateInitiative();
   const [name, setName] = useState(initiative.name);
   const [description, setDescription] = useState(initiative.description || '');
   const [status, setStatus] = useState(initiative.status);
   const [ownerId, setOwnerId] = useState(initiative.owner?.id || 'none');
   const [target, setTarget] = useState(initiative.target || '');
   const [priorityId, setPriorityId] = useState(initiative.priority.id);
   const [healthId, setHealthId] = useState(initiative.health.id);

   useEffect(() => {
      if (!open) return;
      setName(initiative.name);
      setDescription(initiative.description || '');
      setStatus(initiative.status);
      setOwnerId(initiative.owner?.id || 'none');
      setTarget(initiative.target || '');
      setPriorityId(initiative.priority.id);
      setHealthId(initiative.health.id);
   }, [initiative, open]);

   const submit = async (event: React.FormEvent) => {
      event.preventDefault();
      await updateMutation.mutateAsync({
         id: initiative.id,
         payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            status,
            ownerId: ownerId === 'none' ? undefined : ownerId,
            target: target.trim() || undefined,
            priorityId,
            healthId,
         },
      });
      onOpenChange(false);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[520px]">
            <form onSubmit={submit}>
               <DialogHeader>
                  <DialogTitle>Edit initiative</DialogTitle>
                  <DialogDescription>Update persisted initiative properties.</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                     <Label htmlFor="initiative-edit-name">Name</Label>
                     <Input
                        id="initiative-edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                     />
                  </div>
                  <div className="grid gap-2">
                     <Label htmlFor="initiative-edit-description">Description</Label>
                     <Textarea
                        id="initiative-edit-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                           value={status}
                           onValueChange={(value) => setStatus(value as Initiative['status'])}
                        >
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="grid gap-2">
                        <Label>Owner</Label>
                        <Select value={ownerId} onValueChange={setOwnerId}>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">No owner</SelectItem>
                              {members.map((member) => (
                                 <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="grid gap-2">
                        <Label>Priority</Label>
                        <Select value={priorityId} onValueChange={setPriorityId}>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {['no-priority', 'urgent', 'high', 'medium', 'low'].map((value) => (
                                 <SelectItem key={value} value={value}>
                                    {value.replace('-', ' ')}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="grid gap-2">
                        <Label>Health</Label>
                        <Select value={healthId} onValueChange={setHealthId}>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {['on-track', 'at-risk', 'off-track', 'no-update'].map((value) => (
                                 <SelectItem key={value} value={value}>
                                    {value.replace('-', ' ')}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="grid gap-2">
                     <Label htmlFor="initiative-edit-target">Target</Label>
                     <Input
                        id="initiative-edit-target"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="Q4 2026"
                     />
                  </div>
               </div>
               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                     Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending || !name.trim()}>
                     Save changes
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
