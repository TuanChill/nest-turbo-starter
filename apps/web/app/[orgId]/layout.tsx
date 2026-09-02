'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaces } from '@/hooks/queries';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationsStore } from '@/store/notifications-store';
import { ROUTES } from '@/constants/routes';

export default function WorkspaceOrgLayout({ children }: { children: React.ReactNode }) {
   const router = useRouter();
   const params = useParams<{ orgId?: string }>();
   const currentOrgId = params?.orgId;
   const { isAuthenticated } = useAuthStore();
   const { data: workspaces, isLoading, isFetched } = useWorkspaces();
   const { initNotifications, isInitialized: notificationsInitialized } = useNotificationsStore();

   React.useEffect(() => {
      if (isAuthenticated && !notificationsInitialized) {
         initNotifications();
      }
   }, [isAuthenticated, notificationsInitialized, initNotifications]);

   React.useEffect(() => {
      if (isLoading || !isFetched) return;

      // If user is authenticated but has 0 workspaces -> Force them to onboarding
      if (workspaces && workspaces.length === 0) {
         router.replace(ROUTES.ONBOARDING);
         return;
      }

      // If user has workspaces, ensure the current orgId is valid for this user
      if (workspaces && workspaces.length > 0 && currentOrgId) {
         const matchingWorkspace = workspaces.find(
            (ws) => ws.slug === currentOrgId || ws.id === currentOrgId
         );

         // If the user navigated to an invalid orgId (e.g. legacy lndev-ui or foreign slug)
         if (!matchingWorkspace) {
            const fallbackSlug = workspaces[0].slug || workspaces[0].id;
            router.replace(ROUTES.WORKSPACE.MY_ISSUES(fallbackSlug));
         }
      }
   }, [workspaces, isLoading, isFetched, currentOrgId, router]);

   return <>{children}</>;
}
