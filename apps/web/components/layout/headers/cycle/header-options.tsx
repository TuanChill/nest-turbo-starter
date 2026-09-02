'use client';

import { Button } from '@/components/ui/button';
import { IssueFilterTrigger } from '@/components/common/issues/issue-filter-trigger';
import { useCycles } from '@/hooks/queries/use-cycles-query';
import { useIssues } from '@/hooks/queries/use-issues-query';
import { useRightPanelStore } from '@/store/right-panel-store';
import { BarChart3, PanelRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { DisplayOptions } from '../display-options';
import { CycleView } from '@/components/common/issues/cycle-issues';

export default function HeaderOptions({ cycleView }: { cycleView: CycleView }) {
   const { teamId } = useParams<{ teamId: string }>();
   const { openPanel, togglePanel } = useRightPanelStore();
   const { data: issues = [] } = useIssues();
   const { data: cycles = [] } = useCycles(teamId);

   const cycle = cycles.find((c) => c.status === (cycleView === 'active' ? 'current' : 'upcoming'));
   const count = cycle ? issues.filter((issue) => issue.cycleId === cycle.id).length : 0;

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
               {count} {count === 1 ? 'issue' : 'issues'}
            </span>
         </div>

         <div className="flex items-center gap-1">
            <IssueFilterTrigger />
            <Button
               size="xs"
               variant={openPanel === 'insights' ? 'secondary' : 'ghost'}
               onClick={() => togglePanel('insights')}
               aria-label="Toggle insights panel"
            >
               <BarChart3 className="size-4" />
            </Button>
            <Button
               size="xs"
               variant={openPanel === 'cycle-details' ? 'secondary' : 'ghost'}
               onClick={() => togglePanel('cycle-details')}
               aria-label="Toggle cycle details panel"
            >
               <PanelRight className="size-4" />
            </Button>
            <DisplayOptions />
         </div>
      </div>
   );
}
