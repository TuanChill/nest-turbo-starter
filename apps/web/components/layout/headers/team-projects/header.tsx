'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTeams } from '@/hooks/queries/use-teams-query';
import { ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CreateProjectDialog } from '@/components/common/projects/create-project-dialog';

export default function Header() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: teams = [], isLoading } = useTeams();
   const team = teams.find((t) => t.id === teamId);
   if (!team) {
      return (
         <div className="w-full flex items-center gap-2 border-b py-1.5 px-6 h-10">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">
               {isLoading ? 'Loading team…' : 'Team not found'}
            </span>
         </div>
      );
   }

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
            <span className="text-sm font-medium">Projects</span>
            <Star className="size-3.5 text-muted-foreground shrink-0 ml-1" />
         </div>
         <div className="flex items-center gap-2">
            <CreateProjectDialog defaultTeamId={team.id} />
         </div>
      </div>
   );
}
