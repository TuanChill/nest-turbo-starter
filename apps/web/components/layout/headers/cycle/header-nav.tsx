'use client';

import { CyclePlayIcon } from '@/components/common/cycles/cycle-line';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useCycles } from '@/hooks/queries/use-cycles-query';
import { useTeams } from '@/hooks/queries/use-teams-query';
import { CheckCircle2, ChevronRight, Link2, MoreHorizontal, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CycleView } from '@/components/common/issues/cycle-issues';
import { CompleteCycleDialog } from '@/components/common/cycles/complete-cycle-dialog';

export default function HeaderNav({ cycleView }: { cycleView: CycleView }) {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: teams = [] } = useTeams();
   const team = teams.find((t) => t.id === teamId) ??
      teams[0] ?? { id: 'CORE', name: 'Core', icon: '🛠️' };
   const { data: cycles = [] } = useCycles(teamId);
   const cycle = cycles.find((c) => c.status === (cycleView === 'active' ? 'current' : 'upcoming'));
   const nextCycle = cycles.find((c) => c.status === 'upcoming');
   const cycleName = cycle?.name ?? (cycleView === 'active' ? 'Current cycle' : 'Upcoming cycle');
   const [isCompleteOpen, setIsCompleteOpen] = useState(false);

   const handleCopyLink = () => {
      const url = `${window.location.origin}/${orgId}/team/${team.id}/cycle/${cycleView}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
   };

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />
            <Link
               href={`/${orgId}/team/${team.id}/overview`}
               className="flex items-center gap-1.5 min-w-0 hover:opacity-80"
            >
               <div className="inline-flex size-5 bg-muted/50 items-center justify-center rounded shrink-0 text-xs">
                  {team.icon}
               </div>
               <span className="text-sm font-medium truncate">{team.name}</span>
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <Link
               href={`/${orgId}/team/${team.id}/cycles`}
               className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
               Cycles
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
               <CyclePlayIcon className="size-3.5" />
               <span className="text-sm font-medium truncate">{cycleName}</span>
            </div>
            <Button variant="ghost" size="icon" className="size-6 text-muted-foreground ml-1">
               <Star className="size-3.5" />
            </Button>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-6 text-muted-foreground">
                     <MoreHorizontal className="size-3.5" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleCopyLink}>
                     <Link2 className="size-3.5" />
                     Copy link
                  </DropdownMenuItem>
                  {cycleView === 'active' && cycle && (
                     <DropdownMenuItem onClick={() => setIsCompleteOpen(true)}>
                        <CheckCircle2 className="size-3.5" />
                        Complete cycle
                     </DropdownMenuItem>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
         {cycle && (
            <CompleteCycleDialog
               open={isCompleteOpen}
               onOpenChange={setIsCompleteOpen}
               cycle={cycle}
               nextCycle={nextCycle}
            />
         )}
      </div>
   );
}
