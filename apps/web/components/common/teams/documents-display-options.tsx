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
import { useDocumentsDisplayStore, DocOrdering } from '@/store/documents-display-store';
import { SlidersHorizontal } from 'lucide-react';

export function DocumentsDisplayOptions() {
   const { ordering, pinToTop, setOrdering, setPinToTop } = useDocumentsDisplayStore();

   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost">
               <SlidersHorizontal className="size-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-64 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">Order by</span>
               <Select value={ordering} onValueChange={(val: DocOrdering) => setOrdering(val)}>
                  <SelectTrigger className="w-32 h-7 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="name">Name (A-Z)</SelectItem>
                     <SelectItem value="updatedAt">Last edited</SelectItem>
                     <SelectItem value="createdAt">Date created</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/40">
               <span className="text-xs text-muted-foreground">Pin favorites to top</span>
               <input
                  type="checkbox"
                  checked={pinToTop}
                  onChange={(e) => setPinToTop(e.target.checked)}
                  className="rounded border-border cursor-pointer"
               />
            </div>
         </PopoverContent>
      </Popover>
   );
}
