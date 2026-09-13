import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { LandingPage } from '@/components/marketing/landing-page';
import { getSavedWorkspaceFromCookieStore } from '@/lib/utils/workspace-persistence';

export default async function Home() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('accessToken')?.value;

   if (accessToken) {
      const lastWorkspace = getSavedWorkspaceFromCookieStore(cookieStore);
      redirect(ROUTES.DEFAULT_WORKSPACE_DASHBOARD(lastWorkspace || 'circle-workspace'));
   }

   return <LandingPage />;
}
