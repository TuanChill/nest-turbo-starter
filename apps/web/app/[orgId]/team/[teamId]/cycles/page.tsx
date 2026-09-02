import Cycles from '@/components/common/cycles/cycles';
import Header from '@/components/layout/headers/cycles/header';
import MainLayout from '@/components/layout/main-layout';

interface CyclesPageProps {
   params: Promise<{ teamId: string }>;
}

export default async function CyclesPage({ params }: CyclesPageProps) {
   const { teamId } = await params;

   return (
      <MainLayout header={<Header />} headersNumber={1}>
         <Cycles teamId={teamId} />
      </MainLayout>
   );
}
