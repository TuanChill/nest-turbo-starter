'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { CreateProjectDialog } from '@/components/common/projects/create-project-dialog';

export default function HeaderNav() {
   const { data: projects = [] } = useProjects();
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger className="" />
            <div className="flex items-center gap-1">
               <span className="text-sm font-medium">Projects</span>
               <span className="text-xs bg-accent rounded-md px-1.5 py-1">{projects.length}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <CreateProjectDialog />
         </div>
      </div>
   );
}
