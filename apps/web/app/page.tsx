import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { LandingPage } from '@/components/marketing/landing-page';

export default async function Home() {
   const cookieStore = await cookies();
   const accessToken = cookieStore.get('accessToken')?.value;

   if (accessToken) {
      redirect(ROUTES.DEFAULT_WORKSPACE_DASHBOARD());
   }

   return <LandingPage />;
}
