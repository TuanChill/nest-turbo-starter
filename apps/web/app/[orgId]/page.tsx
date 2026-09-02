import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export default async function OrgIdPage({ params }: { params: Promise<{ orgId: string }> }) {
   const { orgId } = await params;
   redirect(ROUTES.WORKSPACE.MY_ISSUES(orgId));
}
