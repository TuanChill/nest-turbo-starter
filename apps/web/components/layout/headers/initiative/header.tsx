'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { EditInitiativeDialog } from '@/components/common/initiatives/edit-initiative-dialog';
import { useDeleteInitiative, useInitiatives } from '@/hooks/queries/use-initiatives-query';
import { ChevronRight, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

const TABS = ['overview', 'activity', 'projects'] as const;

export default function Header() {
   const { orgId, initiativeId } = useParams<{ orgId: string; initiativeId: string }>();
   const { data: initiatives = [] } = useInitiatives();
   const initiative = initiatives.find((i) => i.id === initiativeId);
   const deleteInitiativeMutation = useDeleteInitiative();
   const router = useRouter();
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(TABS).withDefault('overview'));

   if (!initiative) return null;

   return (
      <div className="w-full flex flex-col">
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
            <div className="flex items-center gap-2 min-w-0">
               <SidebarTrigger />
               <Link
                  href={`/${orgId}/initiatives`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
               >
                  Initiatives
               </Link>
               <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
               <span className="inline-flex size-5 items-center justify-center rounded bg-muted/50 text-xs shrink-0">
                  {initiative.icon}
               </span>
               <span className="text-sm font-medium truncate">{initiative.name}</span>
               <Star className="size-3.5 text-muted-foreground shrink-0 ml-1" />
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button
                        type="button"
                        aria-label="Initiative actions"
                        className="inline-flex items-center justify-center size-6 rounded hover:bg-accent text-muted-foreground"
                     >
                        <MoreHorizontal className="size-3.5 shrink-0" />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                     <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
                        Edit initiative
                     </DropdownMenuItem>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                              <Trash2 className="size-3.5" />
                              Delete initiative
                           </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                           <AlertDialogHeader>
                              <AlertDialogTitle>Delete {initiative.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                 Linked projects will remain, but the initiative link will be
                                 removed.
                              </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                 onClick={() =>
                                    deleteInitiativeMutation.mutate(initiative.id, {
                                       onSuccess: () => router.push(`/${orgId}/initiatives`),
                                    })
                                 }
                              >
                                 Delete initiative
                              </AlertDialogAction>
                           </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                  </DropdownMenuContent>
               </DropdownMenu>
               <EditInitiativeDialog
                  initiative={initiative}
                  open={isEditOpen}
                  onOpenChange={setIsEditOpen}
               />
            </div>
         </div>
         <div className="w-full flex items-center border-b py-1.5 px-6 h-10 gap-1.5">
            {TABS.map((candidate) => (
               <button
                  key={candidate}
                  onClick={() => setTab(candidate)}
                  className={cn(
                     'px-2.5 py-1 rounded-md border text-xs font-medium capitalize transition-colors',
                     tab === candidate
                        ? 'bg-accent border-transparent'
                        : 'text-muted-foreground hover:bg-accent/50'
                  )}
               >
                  {candidate}
               </button>
            ))}
         </div>
      </div>
   );
}
