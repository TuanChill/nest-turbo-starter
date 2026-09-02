'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMembers } from '@/hooks/queries/use-members-query';
import { InviteMemberDialog } from '@/components/common/members/invite-member-dialog';

export default function HeaderNav() {
   const { data: members = [] } = useMembers();
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger className="" />
            <div className="flex items-center gap-1">
               <span className="text-sm font-medium">Members</span>
               <span className="text-xs bg-accent rounded-md px-1.5 py-1">{members.length}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <InviteMemberDialog />
         </div>
      </div>
   );
}
