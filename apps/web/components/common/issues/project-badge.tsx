import { Badge } from '@/components/ui/badge';
import type { Project } from '@/mock-data/projects';
import { renderProjectIcon } from '@/lib/project-utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function ProjectBadge({ project }: { project: Project }) {
   const { orgId } = useParams<{ orgId?: string }>();

   return (
      <Link href={`/${orgId ?? ''}/projects`} className="flex items-center justify-center gap-.5">
         <Badge
            variant="outline"
            className="gap-1.5 rounded-full text-muted-foreground bg-background"
         >
            {renderProjectIcon(project.icon, 'size-4')}
            {project.name}
         </Badge>
      </Link>
   );
}
