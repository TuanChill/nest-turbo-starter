'use client';

import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIssues } from '@/hooks/queries/use-issues-query';
import { useAddIssueRelation } from '@/hooks/queries/use-issues-query';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import QueryErrorState from '@/components/common/query-error-state';

type RelationType = 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of';

const RELATION_TYPE_LABEL: Record<RelationType, string> = {
   blocks: 'Blocks',
   blocked_by: 'Blocked by',
   relates_to: 'Relates to',
   duplicate_of: 'Duplicate of',
};

interface RelationSelectorProps {
   issueIdentifier: string;
   teamId: string;
}

/** Popover to link the current issue to another existing issue (blocks / blocked by / relates to / duplicate of). */
export function RelationSelector({ issueIdentifier, teamId }: RelationSelectorProps) {
   const [open, setOpen] = useState(false);
   const [relationType, setRelationType] = useState<RelationType>('relates_to');
   const issuesQuery = useIssues();
   const { data: issues = [] } = issuesQuery;
   const { mutate: addRelation } = useAddIssueRelation();

   const candidates = issues.filter((i) => i.identifier !== issueIdentifier && i.teamId === teamId);

   const handleSelect = (targetIdentifier: string) => {
      setOpen(false);
      addRelation({ identifier: issueIdentifier, targetIdentifier, relationType });
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               size="sm"
               variant="ghost"
               className="h-6 px-1.5 gap-1 text-sm text-muted-foreground hover:text-foreground -ml-1.5"
            >
               <Plus className="size-3.5" />
               Add relation
            </Button>
         </PopoverTrigger>
         <PopoverContent className="border-input w-72 p-0" align="start">
            {issuesQuery.isError ? (
               <QueryErrorState
                  subject="issues for this relation"
                  error={issuesQuery.error}
                  compact
                  onRetry={() => void issuesQuery.refetch()}
               />
            ) : (
               <>
                  <div className="flex items-center gap-1 p-1.5 border-b flex-wrap">
                     {(Object.keys(RELATION_TYPE_LABEL) as RelationType[]).map((type) => (
                        <button
                           key={type}
                           onClick={() => setRelationType(type)}
                           className={cn(
                              'text-xs px-2 py-1 rounded-md',
                              relationType === type
                                 ? 'bg-accent text-foreground'
                                 : 'text-muted-foreground hover:text-foreground'
                           )}
                        >
                           {RELATION_TYPE_LABEL[type]}
                        </button>
                     ))}
                  </div>
                  <Command>
                     <CommandInput placeholder="Search issues..." />
                     <CommandList>
                        <CommandEmpty>No issues found.</CommandEmpty>
                        <CommandGroup>
                           {candidates.map((candidate) => (
                              <CommandItem
                                 key={candidate.id}
                                 value={`${candidate.identifier} ${candidate.title}`}
                                 onSelect={() => handleSelect(candidate.identifier)}
                              >
                                 <span className="text-muted-foreground shrink-0">
                                    {candidate.identifier}
                                 </span>
                                 <span className="truncate">{candidate.title}</span>
                              </CommandItem>
                           ))}
                        </CommandGroup>
                     </CommandList>
                  </Command>
               </>
            )}
         </PopoverContent>
      </Popover>
   );
}
