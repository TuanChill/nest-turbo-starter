'use client';

import {
   Archive,
   Bell,
   Box,
   ChevronRight,
   CopyMinus,
   Home,
   Layers,
   Link as LinkIcon,
   MoreHorizontal,
   Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuAction,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useTeams, useUpdateTeam } from '@/hooks/queries/use-teams-query';
import { RiDonutChartFill } from '@remixicon/react';
import { ROUTES } from '@/constants/routes';

export function NavTeams() {
   const params = useParams<{ orgId?: string }>();
   const orgId = params?.orgId;
   const pathname = usePathname();
   const { data: teams = [] } = useTeams();
   const updateTeamMutation = useUpdateTeam();
   const joinedTeams = teams.filter((t) => t.joined);

   if (!orgId) return null;

   const toggleJoin = (teamId: string) => {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
         updateTeamMutation.mutate({
            id: teamId,
            data: { joined: !team.joined },
         });
      }
   };

   return (
      <SidebarGroup>
         <SidebarGroupLabel>Your teams</SidebarGroupLabel>
         <SidebarMenu>
            {joinedTeams.map((item) => (
               <Collapsible key={item.id} asChild defaultOpen={true} className="group/collapsible">
                  <SidebarMenuItem>
                     <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.name}>
                           <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                           <span className="text-xs">{item.icon}</span>
                           <span>{item.name}</span>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <SidebarMenuAction asChild showOnHover>
                                    <div>
                                       <MoreHorizontal />
                                       <span className="sr-only">More</span>
                                    </div>
                                 </SidebarMenuAction>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                 className="w-48 rounded-lg"
                                 side="right"
                                 align="start"
                              >
                                 <DropdownMenuItem asChild>
                                    <Link
                                       href={ROUTES.WORKSPACE.SETTINGS_TEAM_DETAIL(orgId, item.id)}
                                    >
                                       <Settings className="size-4 mr-2" />
                                       <span>Team settings</span>
                                    </Link>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem>
                                    <LinkIcon className="size-4 mr-2" />
                                    <span>Copy link</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem>
                                    <Archive className="size-4 mr-2" />
                                    <span>Open archive</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem>
                                    <Bell className="size-4 mr-2" />
                                    <span>Subscribe</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem
                                    onClick={() => toggleJoin(item.id)}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                 >
                                    <span>Leave team</span>
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </SidebarMenuButton>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                        <SidebarMenuSub>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                 asChild
                                 isActive={pathname === ROUTES.TEAM.HOME(orgId, item.id)}
                              >
                                 <Link href={ROUTES.TEAM.HOME(orgId, item.id)}>
                                    <Home size={14} />
                                    <span>Home</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                 asChild
                                 isActive={pathname === ROUTES.TEAM.ALL_ISSUES(orgId, item.id)}
                              >
                                 <Link href={ROUTES.TEAM.ALL_ISSUES(orgId, item.id)}>
                                    <CopyMinus size={14} />
                                    <span>Issues</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                 asChild
                                 isActive={pathname === ROUTES.TEAM.CYCLES(orgId, item.id)}
                              >
                                 <Link href={ROUTES.TEAM.CYCLES(orgId, item.id)}>
                                    <RiDonutChartFill size={14} />
                                    <span>Cycles</span>
                                 </Link>
                              </SidebarMenuSubButton>
                              <SidebarMenuSub className="mr-0 pr-0">
                                 <SidebarMenuSubItem>
                                    <SidebarMenuSubButton
                                       asChild
                                       isActive={
                                          pathname === ROUTES.TEAM.CYCLE_ACTIVE(orgId, item.id)
                                       }
                                    >
                                       <Link href={ROUTES.TEAM.CYCLE_ACTIVE(orgId, item.id)}>
                                          <span>Current</span>
                                       </Link>
                                    </SidebarMenuSubButton>
                                 </SidebarMenuSubItem>
                                 <SidebarMenuSubItem>
                                    <SidebarMenuSubButton
                                       asChild
                                       isActive={
                                          pathname === ROUTES.TEAM.CYCLE_UPCOMING(orgId, item.id)
                                       }
                                    >
                                       <Link href={ROUTES.TEAM.CYCLE_UPCOMING(orgId, item.id)}>
                                          <span>Upcoming</span>
                                       </Link>
                                    </SidebarMenuSubButton>
                                 </SidebarMenuSubItem>
                              </SidebarMenuSub>
                           </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                 asChild
                                 isActive={pathname === ROUTES.TEAM.PROJECTS(orgId, item.id)}
                              >
                                 <Link href={ROUTES.TEAM.PROJECTS(orgId, item.id)}>
                                    <Box size={14} />
                                    <span>Projects</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                 asChild
                                 isActive={pathname === ROUTES.TEAM.VIEWS(orgId, item.id)}
                              >
                                 <Link href={ROUTES.TEAM.VIEWS(orgId, item.id)}>
                                    <Layers size={14} />
                                    <span>Views</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                        </SidebarMenuSub>
                     </CollapsibleContent>
                  </SidebarMenuItem>
               </Collapsible>
            ))}
         </SidebarMenu>
      </SidebarGroup>
   );
}
