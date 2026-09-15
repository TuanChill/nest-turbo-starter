'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTeam } from '@/hooks/queries/use-teams-query';
import { useDocuments } from '@/hooks/queries/use-documents-query';
import { CreateDocumentDialog } from './create-document-dialog';
import QueryErrorState from '@/components/common/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { RiDonutChartFill } from '@remixicon/react';
import { Box, CopyMinus, Layers, Settings, SquareStack } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

/**
 * Team Home — "Overview" tab: team identity, pinned resources and
 * quick links, Linear-style.
 */
export default function TeamOverview() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: team, isLoading, isError, error, refetch } = useTeam(teamId);
   const { data: folders = [] } = useDocuments(teamId);
   const [createDocumentOpen, setCreateDocumentOpen] = useState(false);

   const pinnedDocuments = folders
      .flatMap((folder) => folder.documents)
      .filter((doc) => doc.pinned);

   if (isError) {
      return <QueryErrorState subject="team" error={error} onRetry={() => refetch()} />;
   }

   if (isLoading || !team) {
      return (
         <div className="w-full max-w-5xl mx-auto px-8 py-10 space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
         </div>
      );
   }

   const goToLinks = [
      { label: 'Team settings', icon: Settings, href: `/${orgId}/settings/teams/${team.id}` },
      { label: 'Issues', icon: CopyMinus, href: `/${orgId}/team/${team.id}/all` },
      { label: 'Cycles', icon: RiDonutChartFill, href: `/${orgId}/team/${team.id}/cycles` },
      { label: 'Projects', icon: Box, href: `/${orgId}/projects` },
      { label: 'Views', icon: Layers, href: `/${orgId}/team/${team.id}/views` },
   ];

   return (
      <div className="w-full max-w-5xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-12">
         {/* Main column */}
         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4">
               <div className="inline-flex size-12 bg-muted/50 items-center justify-center rounded-lg text-2xl shrink-0">
                  {team.icon}
               </div>
               <h1 className="text-3xl font-semibold">{team.name}</h1>
            </div>

            <p className="mt-4 text-muted-foreground">
               {team.description?.trim() || 'No description set for this team.'}
            </p>

            <div className="mt-12">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Team resources</h2>
                  <div className="flex items-center gap-1">
                     <CreateDocumentDialog
                        open={createDocumentOpen}
                        onOpenChange={setCreateDocumentOpen}
                        trigger={
                           <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-full border"
                              aria-label="Add team resource"
                              title="Add team resource"
                           >
                              <span className="text-base leading-none">＋</span>
                           </Button>
                        }
                     />
                     <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-full border"
                        aria-label="Open all team resources"
                        title="Open all team resources"
                     >
                        <Link href={`/${orgId}/team/${team.id}/documents`}>
                           <SquareStack className="size-4" />
                        </Link>
                     </Button>
                  </div>
               </div>

               <div className="mt-4 flex flex-col gap-1">
                  {pinnedDocuments.length === 0 && (
                     <p className="text-sm text-muted-foreground">No resources yet.</p>
                  )}
                  {pinnedDocuments.map((doc) => (
                     <Link
                        key={doc.id}
                        href={`/${orgId}/team/${team.id}/documents`}
                        className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-sidebar/50 text-sm"
                     >
                        <span className="text-base leading-none">{doc.icon}</span>
                        <span className="font-medium">{doc.name}</span>
                     </Link>
                  ))}
               </div>
            </div>
         </div>

         {/* Side column */}
         <div className="w-full lg:w-60 shrink-0">
            <h3 className="text-sm font-medium text-muted-foreground">Members</h3>
            <Link
               href={`/${orgId}/team/${team.id}/members`}
               className="mt-2 flex items-center gap-2 hover:opacity-80"
            >
               <div className="flex -space-x-1.5">
                  {team.members.slice(0, 4).map((member) => (
                     <Avatar key={member.id} className="size-5 ring-2 ring-background">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                     </Avatar>
                  ))}
               </div>
               <span className="text-sm text-muted-foreground">{team.members.length}</span>
            </Link>

            <h3 className="text-sm font-medium text-muted-foreground mt-8">Go to</h3>
            <div className="mt-2 flex flex-col">
               {goToLinks.map((link) => (
                  <Link
                     key={link.label}
                     href={link.href}
                     className="flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-md hover:bg-sidebar/50 text-sm"
                  >
                     <link.icon className="size-4 text-muted-foreground" />
                     {link.label}
                  </Link>
               ))}
            </div>
         </div>
      </div>
   );
}
