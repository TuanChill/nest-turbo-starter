import MemberProfile from '@/components/common/members/member-profile';
import Header from '@/components/layout/headers/profile/header';
import MainLayout from '@/components/layout/main-layout';
import type { Member } from '@/services/members.service';
import { getMemberById } from '@/lib/api/members';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

interface MemberProfilePageProps {
   params: Promise<{ memberId: string }>;
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
   const { memberId } = await params;

   let member: Member | undefined;

   try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('accessToken')?.value;
      const data = await getMemberById(memberId, accessToken);
      if (data) {
         member = data;
      }
   } catch {
      member = undefined;
   }

   if (!member) {
      notFound();
   }

   return (
      <MainLayout header={<Header member={member} />}>
         <MemberProfile member={member} />
      </MainLayout>
   );
}
