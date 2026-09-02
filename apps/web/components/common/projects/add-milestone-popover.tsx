'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAddMilestone } from '@/hooks/queries/use-projects-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface AddMilestonePopoverProps {
   projectId: string;
}

/** Small popover to add a milestone (name + optional target date) to a project. */
export function AddMilestonePopover({ projectId }: AddMilestonePopoverProps) {
   const [open, setOpen] = useState(false);
   const [name, setName] = useState('');
   const [targetDate, setTargetDate] = useState('');
   const { mutate: addMilestone, isPending } = useAddMilestone();

   const handleSubmit = () => {
      const trimmed = name.trim();
      if (!trimmed) return;
      addMilestone(
         { projectId, payload: { name: trimmed, targetDate: targetDate || undefined } },
         {
            onSuccess: () => {
               setName('');
               setTargetDate('');
               setOpen(false);
            },
         }
      );
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
               <Plus className="size-3.5" />
            </button>
         </PopoverTrigger>
         <PopoverContent className="w-64 p-3 flex flex-col gap-2" align="end">
            <Input
               placeholder="Milestone name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
               autoFocus
            />
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || isPending}>
               Add milestone
            </Button>
         </PopoverContent>
      </Popover>
   );
}
