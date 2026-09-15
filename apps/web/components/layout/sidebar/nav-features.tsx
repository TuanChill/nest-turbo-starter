'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { featuresItems } from '@/lib/sidebar-catalog';

export function NavFeatures() {
   const pathname = usePathname();

   return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
         <SidebarGroupLabel>Features</SidebarGroupLabel>
         <SidebarMenu>
            {featuresItems.map((item) => (
               <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                     <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.name}</span>
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            ))}
         </SidebarMenu>
      </SidebarGroup>
   );
}
