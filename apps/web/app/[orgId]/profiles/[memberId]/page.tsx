import MemberProfile from '@/components/common/members/member-profile';
import Header from '@/components/layout/headers/profile/header';
import MainLayout from '@/components/layout/main-layout';
import { User } from '@/mock-data/users';
import { getMemberById } from '@/lib/api/members';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

interface MemberProfilePageProps {
   params: Promise<{ memberId: string }>;
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
   const { memberId } = await params;

   let member: User | undefined;

   try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('accessToken')?.value;
      const data = await getMemberById(memberId, accessToken);
      if (data) {
         member = {
            id: data.id,
            name: data.name,
            email: data.email,
            avatarUrl: data.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${data.id}`,
            role: (data.role as User['role']) || 'Member',
            status: (data.status as User['status']) || 'online',
            timezone: data.timezone || 'UTC',
            teamIds: data.teamIds || ['CORE'],
            joinedDate: data.joinedDate || new Date().toISOString(),
         };
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
