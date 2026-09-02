'use client';

import * as React from 'react';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { useCreateCycle, useCycles } from '@/hooks/queries/use-cycles-query';
import { CycleStatus } from '@/mock-data/cycles';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateCycleDialogProps {
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   teamId: string;
}

const STATUS_OPTIONS: { id: CycleStatus; name: string }[] = [
   { id: 'planned', name: 'Planned' },
   { id: 'upcoming', name: 'Upcoming' },
   { id: 'current', name: 'Current' },
   { id: 'completed', name: 'Completed' },
];

function addDaysIso(date: Date, days: number): string {
   const d = new Date(date);
   d.setDate(d.getDate() + days);
   return d.toISOString().split('T')[0];
}

export function CreateCycleDialog({
   trigger,
   open: controlledOpen,
   onOpenChange: setControlledOpen,
   teamId,
}: CreateCycleDialogProps) {
   const [internalOpen, setInternalOpen] = React.useState(false);
   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

   const { data: cycles = [] } = useCycles(teamId);
   const createCycleMutation = useCreateCycle();

   const nextNumber = React.useMemo(
      () => cycles.reduce((max, c) => Math.max(max, c.number), 0) + 1,
      [cycles]
   );

   const [name, setName] = React.useState('');
   const [status, setStatus] = React.useState<CycleStatus>('planned');
   const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
   const [endDate, setEndDate] = React.useState(addDaysIso(new Date(), 14));
   const [capacity, setCapacity] = React.useState('0');
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!startDate || !endDate) {
         toast.error('Please select start and end dates');
         return;
      }
      if (new Date(endDate) < new Date(startDate)) {
         toast.error('End date must be after start date');
         return;
      }

      const trimmedName = name.trim() || `Cycle ${nextNumber}`;

      setIsSubmitting(true);
      try {
         await createCycleMutation.mutateAsync({
            number: nextNumber,
            name: trimmedName,
            teamId,
            status,
            startDate,
            endDate,
            capacity: Number(capacity) || 0,
         });

         setName('');
         setStatus('planned');
         setCapacity('0');
         setOpen(false);
      } catch (err: unknown) {
         console.error('Failed to create cycle:', err);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         {trigger ? (
            <DialogTrigger asChild>{trigger}</DialogTrigger>
         ) : (
            <DialogTrigger asChild>
               <Button className="relative" size="xs" variant="secondary">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline ml-1">Create cycle</span>
               </Button>
            </DialogTrigger>
         )}
         <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden bg-container border-border/60">
            <form onSubmit={handleSubmit}>
               <DialogHeader className="p-5 pb-4 border-b border-border/40">
                  <DialogTitle className="text-base font-semibold">
                     Create cycle {nextNumber}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                     Cycles are fixed time boxes for shipping a set of issues.
                  </DialogDescription>
               </DialogHeader>

               <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                     <Label htmlFor="cycle-name" className="text-xs font-medium">
                        Cycle name
                     </Label>
                     <Input
                        id="cycle-name"
                        placeholder={`Cycle ${nextNumber}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        autoFocus
                        className="h-9 text-sm"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label htmlFor="cycle-start" className="text-xs font-medium">
                           Start date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                           id="cycle-start"
                           type="date"
                           value={startDate}
                           onChange={(e) => setStartDate(e.target.value)}
                           disabled={isSubmitting}
                           required
                           className="h-9 text-xs"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="cycle-end" className="text-xs font-medium">
                           End date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                           id="cycle-end"
                           type="date"
                           value={endDate}
                           onChange={(e) => setEndDate(e.target.value)}
                           disabled={isSubmitting}
                           required
                           className="h-9 text-xs"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Status</Label>
                        <Select
                           value={status}
                           onValueChange={(v) => setStatus(v as CycleStatus)}
                           disabled={isSubmitting}
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-popover border-border/60">
                              {STATUS_OPTIONS.map((s) => (
                                 <SelectItem key={s.id} value={s.id} className="text-xs">
                                    {s.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="cycle-capacity" className="text-xs font-medium">
                           Capacity (%)
                        </Label>
                        <Input
                           id="cycle-capacity"
                           type="number"
                           min={0}
                           max={100}
                           value={capacity}
                           onChange={(e) => setCapacity(e.target.value)}
                           disabled={isSubmitting}
                           className="h-9 text-xs"
                        />
                     </div>
                  </div>
               </div>

               <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2">
                  <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => setOpen(false)}
                     disabled={isSubmitting}
                     className="h-8 text-xs"
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     size="sm"
                     disabled={isSubmitting}
                     className="h-8 text-xs gap-1.5"
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="size-3.5 animate-spin" />
                           Creating...
                        </>
                     ) : (
                        'Create cycle'
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
