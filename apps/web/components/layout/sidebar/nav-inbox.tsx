'use client';

import {
   SidebarGroup,
   SidebarMenu,
   SidebarMenuBadge,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useNotificationsStore } from '@/store/notifications-store';
import {
   isSidebarItemVisible,
   resolveOrder,
   SidebarItemKey,
   useSidebarPrefsStore,
} from '@/store/sidebar-prefs-store';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FolderKanban, Inbox, LucideIcon } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface PersonalNavItem {
   key: SidebarItemKey;
   name: string;
   icon: LucideIcon;
   getUrl: (orgId: string) => string;
}

const PERSONAL_NAV: PersonalNavItem[] = [
   {
      key: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      getUrl: (orgId) => ROUTES.WORKSPACE.INBOX(orgId),
   },
   {
      key: 'my-issues',
      name: 'My issues',
      icon: FolderKanban,
      getUrl: (orgId) => ROUTES.WORKSPACE.MY_ISSUES(orgId),
   },
];

export function NavInbox() {
   const { orgId } = useParams<{ orgId: string }>();
   const pathname = usePathname();
   const { visibility, badgeStyle, order } = useSidebarPrefsStore();
   const { getUnreadCount } = useNotificationsStore();
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);

   const unread = mounted ? getUnreadCount() : 0;

   const orderedNav = mounted
      ? resolveOrder(
           order.personal,
           PERSONAL_NAV.map((item) => item.key)
        )
           .map((key) => PERSONAL_NAV.find((item) => item.key === key))
           .filter((item): item is PersonalNavItem => Boolean(item))
      : PERSONAL_NAV;

   const items = orderedNav.filter((item) => {
      if (!mounted) return true;
      const badge = item.key === 'inbox' ? unread : 0;
      return isSidebarItemVisible(visibility[item.key], badge);
   });

   return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
         <SidebarMenu>
            {items.map((item) => (
               <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={pathname === item.getUrl(orgId)}>
                     <Link href={item.getUrl(orgId)}>
                        <item.icon />
                        <span>{item.name}</span>
                     </Link>
                  </SidebarMenuButton>
                  {mounted && item.key === 'inbox' && unread > 0 && (
                     <SidebarMenuBadge className="text-muted-foreground">
                        {badgeStyle === 'count' ? (
                           unread > 99 ? (
                              '99+'
                           ) : (
                              unread
                           )
                        ) : (
                           <span className="size-1.5 rounded-full bg-muted-foreground inline-block" />
                        )}
                     </SidebarMenuBadge>
                  )}
               </SidebarMenuItem>
            ))}
         </SidebarMenu>
      </SidebarGroup>
   );
}
