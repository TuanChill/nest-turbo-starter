'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import {
   useReviewsDisplayStore,
   ReviewGrouping,
   ReviewOrdering,
} from '@/store/reviews-display-store';
import { SlidersHorizontal } from 'lucide-react';

export function ReviewDisplayOptions() {
   const { grouping, ordering, showCompleted, setGrouping, setOrdering, setShowCompleted } =
      useReviewsDisplayStore();

   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost">
               <SlidersHorizontal className="size-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-64 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">Grouping</span>
               <Select value={grouping} onValueChange={(val: ReviewGrouping) => setGrouping(val)}>
                  <SelectTrigger className="w-32 h-7 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="status">Status</SelectItem>
                     <SelectItem value="none">No grouping</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">Ordering</span>
               <Select value={ordering} onValueChange={(val: ReviewOrdering) => setOrdering(val)}>
                  <SelectTrigger className="w-32 h-7 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="updated">Last updated</SelectItem>
                     <SelectItem value="created">Created date</SelectItem>
                     <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/40">
               <span className="text-xs text-muted-foreground">Show merged PRs</span>
               <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded border-border cursor-pointer"
               />
            </div>
         </PopoverContent>
      </Popover>
   );
}
