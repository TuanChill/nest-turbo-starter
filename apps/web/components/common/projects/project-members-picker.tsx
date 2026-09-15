'use client';

import { useProjectMembers, useUpdateProjectMembers } from '@/hooks/queries/use-projects-query';
import { useMembers } from '@/hooks/queries/use-members-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface ProjectMembersPickerProps {
   projectId: string;
}

/** Persisted multi-member picker for a project, scoped by the active workspace. */
export function ProjectMembersPicker({ projectId }: ProjectMembersPickerProps) {
   const [open, setOpen] = useState(false);
   const { data: persistedMembers = [], isError: membersError } = useProjectMembers(projectId);
   const { data: workspaceMembers = [] } = useMembers();
   const updateMembersMutation = useUpdateProjectMembers();
   const selectedMembers = persistedMembers;
   const selectedIds = new Set(selectedMembers.map((member) => member.id));

   const toggleMember = (memberId: string) => {
      const memberIds = selectedIds.has(memberId)
         ? selectedMembers.filter((member) => member.id !== memberId).map((member) => member.id)
         : [...selectedMembers.map((member) => member.id), memberId];
      updateMembersMutation.mutate({ projectId, memberIds });
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               type="button"
               variant="ghost"
               size="xs"
               className="h-7 px-1.5 gap-1.5 text-left font-normal"
               aria-label="Edit project members"
               disabled={membersError}
               title={membersError ? 'Project members are unavailable' : undefined}
            >
               {membersError ? (
                  <span className="text-destructive">Members unavailable</span>
               ) : selectedMembers.length > 0 ? (
                  <>
                     <span className="flex -space-x-1.5">
                        {selectedMembers.slice(0, 3).map((member) => (
                           <Avatar key={member.id} className="size-5 border-2 border-container">
                              <AvatarImage src={member.avatarUrl} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                        ))}
                     </span>
                     <span className="whitespace-nowrap">
                        {selectedMembers.length}{' '}
                        {selectedMembers.length === 1 ? 'member' : 'members'}
                     </span>
                  </>
               ) : (
                  <>
                     <UserPlus className="size-3.5" />
                     <span>Add members</span>
                  </>
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-72 p-0">
            <Command>
               <CommandInput placeholder="Search workspace members..." />
               <CommandList>
                  {membersError ? (
                     <div className="px-3 py-4 text-sm text-destructive">
                        Project members could not be loaded.
                     </div>
                  ) : (
                     <CommandEmpty>No workspace members found.</CommandEmpty>
                  )}
                  {workspaceMembers.map((member) => {
                     const selected = selectedIds.has(member.id);
                     return (
                        <CommandItem
                           key={member.id}
                           value={`${member.name} ${member.email}`}
                           disabled={updateMembersMutation.isPending}
                           onSelect={() => toggleMember(member.id)}
                        >
                           <Avatar className="size-5">
                              <AvatarImage src={member.avatarUrl} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span className="min-w-0 flex-1 truncate">{member.name}</span>
                           {selected && <Check className="size-4 text-primary" />}
                        </CommandItem>
                     );
                  })}
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
