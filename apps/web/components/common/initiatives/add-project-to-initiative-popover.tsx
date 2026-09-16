'use client';

import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { useUpdateInitiative } from '@/hooks/queries/use-initiatives-query';
import QueryErrorState from '@/components/common/query-error-state';
import { renderProjectIcon } from '@/lib/project-utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface AddProjectToInitiativePopoverProps {
   initiativeId: string;
   linkedProjectIds: string[];
}

/** "+" control next to the initiative's Projects section: links an existing project to it. */
export function AddProjectToInitiativePopover({
   initiativeId,
   linkedProjectIds,
}: AddProjectToInitiativePopoverProps) {
   const [open, setOpen] = useState(false);
   const projectsQuery = useProjects();
   const { data: allProjects = [] } = projectsQuery;
   const { mutate: updateInitiative } = useUpdateInitiative();

   const availableProjects = allProjects.filter(
      (project) => !linkedProjectIds.includes(project.id)
   );

   const handleSelect = (projectId: string) => {
      setOpen(false);
      updateInitiative({
         id: initiativeId,
         payload: { projectIds: [...linkedProjectIds, projectId] },
      });
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
               <Plus className="size-4" />
            </button>
         </PopoverTrigger>
         <PopoverContent className="w-64 p-0" align="end">
            {projectsQuery.isError ? (
               <QueryErrorState
                  subject="initiative projects"
                  error={projectsQuery.error}
                  onRetry={() => void projectsQuery.refetch()}
                  compact
               />
            ) : (
               <Command>
                  <CommandInput placeholder="Add project..." />
                  <CommandList>
                     <CommandEmpty>No project found.</CommandEmpty>
                     <CommandGroup>
                        {availableProjects.map((project) => (
                           <CommandItem
                              key={project.id}
                              value={project.name}
                              onSelect={() => handleSelect(project.id)}
                              className="flex items-center gap-2"
                           >
                              {renderProjectIcon(
                                 project.icon,
                                 'size-4 text-muted-foreground shrink-0'
                              )}
                              <span className="truncate">{project.name}</span>
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            )}
         </PopoverContent>
      </Popover>
   );
}
