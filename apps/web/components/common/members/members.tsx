'use client';

import { useMembers } from '@/hooks/queries/use-members-query';
import MemberLine from './member-line';
import { useMembersFilterStore } from '@/store/members-filter-store';
import { ArrowDown } from 'lucide-react';
import { useMemo } from 'react';
import type { User } from '@/mock-data/users';
import { Skeleton } from '@/components/ui/skeleton';

export default function Members() {
   const { filters, sort } = useMembersFilterStore();
   const { data: members = [], isLoading } = useMembers();

   const displayed = useMemo(() => {
      let list = (members as unknown as User[]).slice();

      // filter by role (called Status in UI)
      if (filters.role.length > 0) {
         const roles = new Set(filters.role);
         list = list.filter((u) => roles.has(u.role));
      }

      // sorting
      const compare = (a: (typeof list)[number], b: (typeof list)[number]) => {
         switch (sort) {
            case 'name-asc':
               return a.name.localeCompare(b.name);
            case 'name-desc':
               return b.name.localeCompare(a.name);
            case 'joined-asc':
               return (
                  new Date(a.joinedDate || '').getTime() - new Date(b.joinedDate || '').getTime()
               );
            case 'joined-desc':
               return (
                  new Date(b.joinedDate || '').getTime() - new Date(a.joinedDate || '').getTime()
               );
            case 'teams-asc':
               return (a.teamIds?.length || 0) - (b.teamIds?.length || 0);
            case 'teams-desc':
               return (b.teamIds?.length || 0) - (a.teamIds?.length || 0);
            default:
               return 0;
         }
      };

      return list.sort(compare);
   }, [members, filters, sort]);

   if (isLoading) {
      return (
         <div className="w-full p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
               <div
                  key={i}
                  className="flex items-center gap-4 py-3 px-4 rounded border border-border/40"
               >
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20 shrink-0" />
                  <Skeleton className="h-4 w-24 shrink-0" />
               </div>
            ))}
         </div>
      );
   }

   return (
      <div className="w-full">
         <div className="bg-container px-6 py-1.5 text-sm flex items-center text-muted-foreground border-b sticky top-0 z-10">
            <div className="flex-1 min-w-0 flex items-center gap-1">
               Name
               <ArrowDown className="size-3" />
            </div>
            <div className="w-[110px] shrink-0">Status</div>
            <div className="hidden lg:block w-[100px] shrink-0">Joined</div>
            <div className="hidden md:block w-[170px] shrink-0">Teams</div>
            <div className="hidden sm:block w-[90px] shrink-0">Last seen</div>
         </div>

         <div className="w-full">
            {displayed.map((user) => (
               <MemberLine key={user.id} user={user} />
            ))}
         </div>
      </div>
   );
}
