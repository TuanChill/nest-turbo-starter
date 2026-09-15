'use client';

import * as React from 'react';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUpdateCycle } from '@/hooks/queries/use-cycles-query';
import { useIssues } from '@/hooks/queries/use-issues-query';
import { useIssuesStore } from '@/store/issues-store';
import { cycleKeys, issueKeys } from '@/hooks/queries/keys';
import type { Cycle } from '@/services/cycles.service';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CompleteCycleDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   cycle: Cycle;
   /** The team's 'upcoming' cycle, if any — offered as a rollover target. */
   nextCycle?: Cycle;
}

/**
 * Confirms ending the active cycle: incomplete issues are moved to the next
 * cycle (or the backlog) before the cycle itself flips to 'completed'. If a
 * next cycle exists it's promoted to 'current', mirroring Linear's
 * end-of-sprint rollover.
 */
export function CompleteCycleDialog({
   open,
   onOpenChange,
   cycle,
   nextCycle,
}: CompleteCycleDialogProps) {
   const { data: allIssues = [] } = useIssues();
   const { updateIssue } = useIssuesStore();
   const updateCycleMutation = useUpdateCycle();
   const queryClient = useQueryClient();
   const [rolloverTarget, setRolloverTarget] = React.useState<'next' | 'backlog'>(
      nextCycle ? 'next' : 'backlog'
   );
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   React.useEffect(() => {
      setRolloverTarget(nextCycle ? 'next' : 'backlog');
   }, [nextCycle, open]);

   const incompleteIssues = React.useMemo(
      () =>
         allIssues.filter(
            (i) =>
               i.cycleId === cycle.id &&
               i.status.category !== 'completed' &&
               i.status.category !== 'canceled'
         ),
      [allIssues, cycle.id]
   );

   const handleComplete = async () => {
      setIsSubmitting(true);
      try {
         const targetCycleId = rolloverTarget === 'next' && nextCycle ? nextCycle.id : '';
         await Promise.all(
            incompleteIssues.map((issue) => updateIssue(issue.id, { cycleId: targetCycleId }))
         );

         await updateCycleMutation.mutateAsync({ id: cycle.id, payload: { status: 'completed' } });
         if (nextCycle) {
            await updateCycleMutation.mutateAsync({
               id: nextCycle.id,
               payload: { status: 'current' },
            });
         }

         await queryClient.invalidateQueries({ queryKey: issueKeys.all });
         await queryClient.invalidateQueries({ queryKey: cycleKeys.lists() });

         toast.success(`${cycle.name} completed`);
      } catch (err) {
         console.error('Failed to complete cycle:', err);
         toast.error('Failed to complete cycle');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>Complete {cycle.name}?</AlertDialogTitle>
               <AlertDialogDescription>
                  {incompleteIssues.length > 0
                     ? `${incompleteIssues.length} incomplete issue${incompleteIssues.length === 1 ? '' : 's'} will be moved before this cycle is marked complete.`
                     : 'All issues in this cycle are complete.'}
               </AlertDialogDescription>
            </AlertDialogHeader>

            {incompleteIssues.length > 0 && (
               <div className="space-y-1.5 px-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                     Move incomplete issues to
                  </Label>
                  <Select
                     value={rolloverTarget}
                     onValueChange={(v) => setRolloverTarget(v as 'next' | 'backlog')}
                  >
                     <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {nextCycle && (
                           <SelectItem value="next">{nextCycle.name} (next cycle)</SelectItem>
                        )}
                        <SelectItem value="backlog">Backlog (no cycle)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            )}

            <AlertDialogFooter>
               <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
               <AlertDialogAction onClick={handleComplete} disabled={isSubmitting}>
                  {isSubmitting ? (
                     <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Completing...
                     </>
                  ) : (
                     'Complete cycle'
                  )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
