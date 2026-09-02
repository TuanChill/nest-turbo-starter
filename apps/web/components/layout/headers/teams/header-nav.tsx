'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTeams } from '@/hooks/queries/use-teams-query';
import { CreateTeamDialog } from '@/components/common/teams/create-team-dialog';

export default function HeaderNav() {
   const { data: teams = [] } = useTeams();
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger className="" />
            <div className="flex items-center gap-1">
               <span className="text-sm font-medium">Teams</span>
               <span className="text-xs bg-accent rounded-md px-1.5 py-1">{teams.length}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <CreateTeamDialog />
         </div>
      </div>
   );
}
