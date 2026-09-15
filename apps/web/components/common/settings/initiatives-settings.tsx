'use client';

import { CreateInitiativeDialog } from '@/components/common/initiatives/create-initiative-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeleteInitiative, useInitiatives } from '@/hooks/queries/use-initiatives-query';
import { INITIATIVE_STATUS_META } from '@/lib/initiative-utils';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function InitiativesSettings() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: initiatives = [], isLoading, isError } = useInitiatives();
   const deleteInitiative = useDeleteInitiative();
   const [query, setQuery] = useState('');
   const [createOpen, setCreateOpen] = useState(false);

   const rows = useMemo(
      () =>
         initiatives.filter((initiative) =>
            initiative.name.toLowerCase().includes(query.trim().toLowerCase())
         ),
      [initiatives, query]
   );

   return (
      <div className="w-full h-full overflow-y-auto">
         <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
            <div className="flex items-start justify-between gap-4">
               <div>
                  <h1 className="text-2xl font-medium">Initiatives</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Group projects into larger bodies of work and track progress from live data.
                  </p>
               </div>
               <Button size="xs" onClick={() => setCreateOpen(true)}>
                  New initiative
               </Button>
            </div>

            <div className="flex items-center justify-between gap-3 mt-6 mb-5">
               <Input
                  placeholder="Filter by name..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-72 h-8"
               />
               <Link
                  href={`/${orgId}/initiatives`}
                  className="text-xs text-muted-foreground hover:text-foreground"
               >
                  Open initiatives
               </Link>
            </div>

            {isLoading && (
               <p className="py-8 text-sm text-muted-foreground">Loading initiatives...</p>
            )}
            {isError && (
               <p className="py-8 text-sm text-destructive">Could not load initiatives.</p>
            )}
            {!isLoading && !isError && rows.length === 0 && (
               <div className="py-16 text-center text-sm text-muted-foreground">
                  {query ? 'No initiatives match this filter.' : 'No initiatives yet.'}
               </div>
            )}
            {!isLoading && !isError && rows.length > 0 && (
               <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center px-3 py-2 text-xs text-muted-foreground border-b">
                     <span className="flex-1">Name</span>
                     <span className="w-28">Status</span>
                     <span className="w-24">Progress</span>
                     <span className="w-36">Owner</span>
                     <span className="w-20" />
                  </div>
                  {rows.map((initiative) => (
                     <div
                        key={initiative.id}
                        className="flex items-center gap-3 px-3 py-3 border-b last:border-b-0"
                     >
                        <Link
                           href={`/${orgId}/initiative/${initiative.id}`}
                           className="flex-1 min-w-0 flex items-center gap-2 hover:text-primary"
                        >
                           <span className="text-lg shrink-0">{initiative.icon}</span>
                           <span className="font-medium truncate">{initiative.name}</span>
                        </Link>
                        <span className="w-28 text-xs text-muted-foreground">
                           {INITIATIVE_STATUS_META[initiative.status].label}
                        </span>
                        <span className="w-24 text-xs text-muted-foreground">
                           {initiative.progressPercent}%
                        </span>
                        <span className="w-36 min-w-0 flex items-center gap-1.5 text-xs text-muted-foreground">
                           {initiative.owner ? (
                              <>
                                 <Avatar className="size-5 shrink-0">
                                    <AvatarImage
                                       src={initiative.owner.avatarUrl}
                                       alt={initiative.owner.name}
                                    />
                                    <AvatarFallback className="text-[9px]">
                                       {initiative.owner.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                 </Avatar>
                                 <span className="truncate">{initiative.owner.name}</span>
                              </>
                           ) : (
                              'No owner'
                           )}
                        </span>
                        <Button
                           type="button"
                           size="xs"
                           variant="ghost"
                           className="w-20 text-destructive"
                           disabled={deleteInitiative.isPending}
                           onClick={() => {
                              if (window.confirm(`Delete initiative "${initiative.name}"?`)) {
                                 deleteInitiative.mutate(initiative.id);
                              }
                           }}
                        >
                           Delete
                        </Button>
                     </div>
                  ))}
               </div>
            )}
         </div>
         <CreateInitiativeDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
   );
}
