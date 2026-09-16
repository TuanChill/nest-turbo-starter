'use client';

import { cycleStatusLabel } from '@/lib/cycle-utils';
import type { Cycle } from '@/services/cycles.service';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CapacityRing } from './capacity-ring';
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
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Ellipsis, Play } from 'lucide-react';
import { useState } from 'react';
import { useStartCycleToday } from '@/hooks/queries/use-cycles-query';

export function CyclePlayIcon({ className }: { className?: string }) {
   return (
      <svg
         width="16"
         height="16"
         viewBox="0 0 16 16"
         fill="none"
         className={cn('text-muted-foreground shrink-0', className)}
         role="img"
         focusable="false"
      >
         <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
         <path d="M6.75 5.75L10.25 8L6.75 10.25V5.75Z" fill="currentColor" />
      </svg>
   );
}

interface CycleLineProps {
   cycle: Cycle;
   canStartToday?: boolean;
}

/**
 * One row of the cycles timeline. Current / upcoming cycles link to their
 * dedicated issue views ("/cycle/active" and "/cycle/upcoming").
 */
export default function CycleLine({ cycle, canStartToday = false }: CycleLineProps) {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const [confirmOpen, setConfirmOpen] = useState(false);
   const startTodayMutation = useStartCycleToday();

   const href =
      cycle.status === 'current'
         ? `/${orgId}/team/${teamId}/cycle/active`
         : cycle.status === 'upcoming'
           ? `/${orgId}/team/${teamId}/cycle/upcoming`
           : undefined;

   const content = (
      <div className="flex-1 min-w-0 flex items-center justify-between gap-4 px-6 h-12 hover:bg-sidebar/50 rounded-md">
         <div className="flex items-center gap-3 min-w-0">
            <CyclePlayIcon />
            <span className="text-sm font-medium truncate">{cycle.name}</span>
         </div>

         <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <span className="text-xs px-2 py-1 rounded-md bg-accent text-muted-foreground whitespace-nowrap">
               {cycleStatusLabel[cycle.status]}
            </span>

            {cycle.status === 'completed' ? (
               <>
                  <div className="hidden sm:flex items-center gap-2 w-28 justify-end">
                     <CapacityRing value={cycle.successRate ?? 0} color="#6771c5" />
                     <span className="text-sm">
                        {cycle.successRate ?? 0}%{' '}
                        <span className="text-muted-foreground">success</span>
                     </span>
                  </div>
                  <span className="hidden md:inline-block text-sm w-28 text-right">
                     {cycle.completed} <span className="text-muted-foreground">completed</span>
                  </span>
               </>
            ) : (
               <div className="hidden sm:flex items-center gap-2 w-36 justify-end whitespace-nowrap">
                  <CapacityRing value={cycle.capacity} color="#6771c5" />
                  <span className="text-sm">
                     {cycle.capacity}% <span className="text-muted-foreground">of capacity</span>
                  </span>
               </div>
            )}

            <span className="text-sm w-14 sm:w-20 text-right whitespace-nowrap">
               {cycle.scope} <span className="text-muted-foreground">scope</span>
            </span>
         </div>
      </div>
   );

   const actions = canStartToday ? (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button
               variant="ghost"
               size="icon"
               className="size-8 mr-3 shrink-0"
               aria-label={`Actions for ${cycle.name}`}
            >
               <Ellipsis className="size-4" />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
            <DropdownMenuItem
               onSelect={(event) => {
                  event.preventDefault();
                  setConfirmOpen(true);
               }}
            >
               <Play className="size-4 mr-2" />
               Start cycle today
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   ) : null;

   return (
      <>
         <div className="w-full flex items-center">
            {href ? (
               <Link href={href} className="flex-1 min-w-0">
                  {content}
               </Link>
            ) : (
               content
            )}
            {actions}
         </div>
         <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Start {cycle.name} today?</AlertDialogTitle>
                  <AlertDialogDescription>
                     This starts the cycle at midnight in the team timezone. Any current cycle will
                     be completed and its open issues will move into this cycle. This change cannot
                     be reverted.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel disabled={startTodayMutation.isPending}>
                     Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                     disabled={startTodayMutation.isPending}
                     onClick={async (event) => {
                        event.preventDefault();
                        await startTodayMutation.mutateAsync(cycle.id);
                        setConfirmOpen(false);
                     }}
                  >
                     {startTodayMutation.isPending ? 'Starting…' : 'Start cycle'}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
}
