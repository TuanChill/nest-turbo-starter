'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { useReviewsFilterStore } from '@/store/reviews-filter-store';
import { ReviewStatus } from '@/mock-data/reviews';
import { Check, ChevronRight, GitPullRequest, ListFilter } from 'lucide-react';
import { PrIcon } from './review-shared';

const STATUS_OPTIONS: { id: ReviewStatus; label: string }[] = [
   { id: 'open', label: 'Open' },
   { id: 'merged', label: 'Merged' },
   { id: 'closed', label: 'Closed' },
];

export function ReviewFilter() {
   const [open, setOpen] = React.useState(false);
   const [activeSection, setActiveSection] = React.useState<'status' | 'author' | null>(null);
   const { statuses, toggleStatus, clearFilters, getActiveCount } = useReviewsFilterStore();
   const count = getActiveCount();

   return (
      <Popover
         open={open}
         onOpenChange={(next) => {
            setOpen(next);
            if (!next) setActiveSection(null);
         }}
      >
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost" className="relative">
               <ListFilter className="size-4" />
               {count > 0 && (
                  <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-primary text-primary-foreground text-[9px] inline-flex items-center justify-center font-medium">
                     {count}
                  </span>
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-56 p-0">
            <Command>
               <CommandInput placeholder={activeSection ? 'Filter...' : 'Add filter...'} />
               <CommandList>
                  <CommandEmpty>No results.</CommandEmpty>
                  {!activeSection && (
                     <CommandGroup>
                        <CommandItem onSelect={() => setActiveSection('status')}>
                           <GitPullRequest className="size-4 text-muted-foreground" />
                           Status
                           <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                        </CommandItem>
                        {count > 0 && (
                           <CommandItem
                              onSelect={() => clearFilters()}
                              className="text-destructive font-medium"
                           >
                              Clear all filters
                           </CommandItem>
                        )}
                     </CommandGroup>
                  )}

                  {activeSection === 'status' && (
                     <CommandGroup>
                        {STATUS_OPTIONS.map((opt) => (
                           <CommandItem key={opt.id} onSelect={() => toggleStatus(opt.id)}>
                              <PrIcon status={opt.id} />
                              <span>{opt.label}</span>
                              {statuses.includes(opt.id) && <Check className="ml-auto size-3.5" />}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
