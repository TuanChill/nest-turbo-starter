'use client';

import { CyclePlayIcon } from '@/components/common/cycles/cycle-line';
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
import { useCycles } from '@/hooks/queries/use-cycles-query';
import { useIssuesStore } from '@/store/issues-store';
import { CheckIcon, ChevronDown } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

interface CycleSelectorProps {
   cycleId?: string;
   issueId: string;
   teamId?: string;
}

/** Popover to assign an issue to one of its team's cycles, or clear it. */
export function CycleSelector({ cycleId, issueId, teamId }: CycleSelectorProps) {
   const id = useId();
   const [open, setOpen] = useState<boolean>(false);
   const [value, setValue] = useState<string>(cycleId ?? '');
   const { data: cycles = [] } = useCycles(teamId, { requireTeamId: true });
   const { updateIssue } = useIssuesStore();

   useEffect(() => {
      setValue(cycleId ?? '');
   }, [cycleId]);

   const handleChange = (newCycleId: string) => {
      setValue(newCycleId);
      setOpen(false);
      updateIssue(issueId, { cycleId: newCycleId });
   };

   const selected = cycles.find((c) => c.id === value);

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               id={id}
               size="sm"
               variant="ghost"
               role="combobox"
               aria-expanded={open}
               className="h-6 px-1.5 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
               <CyclePlayIcon className="size-4" />
               {selected ? selected.name : 'No cycle'}
               <ChevronDown className="size-3 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent
            className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
            align="start"
         >
            <Command>
               <CommandInput placeholder="Set cycle..." />
               <CommandList>
                  <CommandEmpty>No cycle found.</CommandEmpty>
                  <CommandGroup>
                     <CommandItem
                        value="no-cycle"
                        onSelect={() => handleChange('')}
                        className="flex items-center justify-between"
                     >
                        <span className="text-muted-foreground">No cycle</span>
                        {value === '' && <CheckIcon size={16} className="ml-auto" />}
                     </CommandItem>
                     {cycles.map((c) => (
                        <CommandItem
                           key={c.id}
                           value={c.id}
                           onSelect={handleChange}
                           className="flex items-center justify-between"
                        >
                           <div className="flex items-center gap-2">
                              <CyclePlayIcon className="size-4" />
                              {c.name}
                           </div>
                           {value === c.id && <CheckIcon size={16} className="ml-auto" />}
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
