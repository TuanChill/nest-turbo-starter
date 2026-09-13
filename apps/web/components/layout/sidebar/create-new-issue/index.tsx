'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LinearEditor } from '@/components/common/editor/linear-editor';
import { Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTeams } from '@/hooks/queries/use-teams-query';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { Issue } from '@/mock-data/issues';
import { priorities } from '@/mock-data/priorities';
import { status } from '@/mock-data/status';
import { useIssuesStore } from '@/store/issues-store';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { StatusSelector } from './status-selector';
import { PrioritySelector } from './priority-selector';
import { AssigneeSelector } from './assignee-selector';
import { ProjectSelector } from './project-selector';
import { CycleSelector } from './cycle-selector';
import { LabelSelector } from './label-selector';
import { ranks } from '@/mock-data/issues';
import { DialogTitle } from '@radix-ui/react-dialog';

import { useCreateIssue } from '@/hooks/queries/use-issues-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { useCycles } from '@/hooks/queries/use-cycles-query';
import { useQueryClient } from '@tanstack/react-query';
import { issueKeys, projectKeys } from '@/hooks/queries/keys';
import { usePathname } from 'next/navigation';

export function CreateNewIssue() {
   const [createMore, setCreateMore] = useState<boolean>(false);
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
   const {
      isOpen,
      defaultStatus,
      defaultProject,
      defaultTeamId,
      defaultCycle,
      openModal,
      closeModal,
   } = useCreateIssueStore();
   const { addIssue, getAllIssues } = useIssuesStore();
   const createIssueMutation = useCreateIssue();
   const { data: projects = [] } = useProjects();
   const { data: teams = [] } = useTeams();
   const queryClient = useQueryClient();
   const pathname = usePathname();

   // Route-aware context detection
   const routeProjectMatch = pathname.match(/\/project\/([^/]+)/);
   const routeProjectId = routeProjectMatch ? routeProjectMatch[1] : null;
   const routeProject = routeProjectId ? projects.find((p) => p.id === routeProjectId) : null;

   const routeTeamMatch = pathname.match(/\/team\/([^/]+)/);
   const routeTeamId = routeTeamMatch ? routeTeamMatch[1] : null;

   const activeProject = defaultProject || routeProject || undefined;
   const activeTeamId = activeProject?.teamId || defaultTeamId || routeTeamId || teams[0]?.id;
   const activeTeam = teams.find((t) => t.id === activeTeamId);

   // Creating an issue from within a cycle's page (/cycle/active or
   // /cycle/upcoming) should scope it to that cycle, same as the project
   // route-detection above — mirrors cycle-issues.tsx's own cycle lookup.
   const routeCycleMatch = pathname.match(/\/cycle\/(active|upcoming)/);
   const { data: teamCycles = [] } = useCycles(activeTeamId);
   const routeCycle = routeCycleMatch
      ? teamCycles.find(
           (c) => c.status === (routeCycleMatch[1] === 'active' ? 'current' : 'upcoming')
        )
      : null;

   const activeCycle = defaultCycle || routeCycle || undefined;

   const generateUniqueIdentifier = useCallback(() => {
      const identifiers = getAllIssues().map((issue) => issue.identifier);
      let identifier = Math.floor(Math.random() * 999)
         .toString()
         .padStart(3, '0');
      while (identifiers.includes(`LNUI-${identifier}`)) {
         identifier = Math.floor(Math.random() * 999)
            .toString()
            .padStart(3, '0');
      }
      return identifier;
   }, [getAllIssues]);

   const createDefaultData = useCallback(() => {
      const identifier = generateUniqueIdentifier();
      return {
         id: uuidv4(),
         identifier: `LNUI-${identifier}`,
         title: '',
         description: '',
         status: defaultStatus || status.find((s) => s.id === 'to-do')!,
         assignee: null,
         priority: priorities.find((p) => p.id === 'no-priority')!,
         labels: [],
         createdAt: new Date().toISOString(),
         cycleId: activeCycle?.id || '',
         project: activeProject,
         subissues: [],
         rank: ranks[ranks.length - 1],
      };
   }, [defaultStatus, activeProject, activeCycle, generateUniqueIdentifier]);

   const [addIssueForm, setAddIssueForm] = useState<Issue>(createDefaultData());

   useEffect(() => {
      setAddIssueForm(createDefaultData());
   }, [createDefaultData]);

   const createIssue = async () => {
      if (!addIssueForm.title?.trim()) {
         toast.error('Title is required');
         return;
      }

      setIsSubmitting(true);
      try {
         // Persist to backend to obtain canonical unique sequential identifier
         let createdIssue = addIssueForm;
         try {
            const res = await createIssueMutation.mutateAsync({
               title: addIssueForm.title.trim(),
               description: addIssueForm.description,
               statusId: addIssueForm.status?.id,
               statusCategory: addIssueForm.status?.category,
               priorityId: addIssueForm.priority?.id,
               assigneeId: addIssueForm.assignee?.id,
               teamId:
                  addIssueForm.project?.teamId || activeProject?.teamId || activeTeamId || 'ENG',
               projectId: addIssueForm.project?.id || activeProject?.id,
               cycleId: addIssueForm.cycleId,
               labelIds: addIssueForm.labels?.map((l) => l.id),
               rank: addIssueForm.rank,
            });
            if (res) {
               createdIssue = res;
            }
         } catch (backendErr) {
            console.warn('Backend create issue skipped / using local store:', backendErr);
         }

         // Update local zustand store
         addIssue(createdIssue);

         // Refetch and invalidate issues across all components
         await queryClient.invalidateQueries({ queryKey: issueKeys.all });
         await queryClient.invalidateQueries({ queryKey: ['issues'] });
         await queryClient.invalidateQueries({ queryKey: projectKeys.all });
         await queryClient.refetchQueries({ queryKey: ['issues'] });

         if (!createMore) {
            closeModal();
         }
         setAddIssueForm(createDefaultData());
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={isOpen} onOpenChange={(value) => (value ? openModal() : closeModal())}>
         <DialogContent className="w-full sm:max-w-[750px] p-0 shadow-xl top-[30%]">
            <DialogHeader>
               <DialogTitle>
                  <div className="flex items-center px-4 pt-4 gap-2">
                     <Button size="sm" variant="outline" className="gap-1.5">
                        {activeTeam ? (
                           <span className="text-sm leading-none">{activeTeam.icon}</span>
                        ) : (
                           <Heart className="size-4 text-orange-500 fill-orange-500" />
                        )}
                        <span className="font-medium">{activeTeam?.id || 'CORE'}</span>
                     </Button>
                  </div>
               </DialogTitle>
            </DialogHeader>

            <div className="px-4 pb-0 space-y-3 w-full">
               <Input
                  className="border-none w-full shadow-none outline-none text-2xl font-medium px-0 h-auto focus-visible:ring-0 overflow-hidden text-ellipsis whitespace-normal break-words"
                  placeholder="Issue title"
                  value={addIssueForm.title}
                  onChange={(e) => setAddIssueForm({ ...addIssueForm, title: e.target.value })}
               />

               <LinearEditor
                  className="px-0 py-0"
                  minHeight="min-h-16"
                  placeholder="Add description or type '/' for commands..."
                  value={addIssueForm.description}
                  onChange={(newDesc) =>
                     setAddIssueForm((prev) => ({ ...prev, description: newDesc }))
                  }
               />

               <div className="w-full flex items-center justify-start gap-1.5 flex-wrap">
                  <StatusSelector
                     status={addIssueForm.status}
                     onChange={(newStatus) =>
                        setAddIssueForm({ ...addIssueForm, status: newStatus })
                     }
                  />
                  <PrioritySelector
                     priority={addIssueForm.priority}
                     onChange={(newPriority) =>
                        setAddIssueForm({ ...addIssueForm, priority: newPriority })
                     }
                  />
                  <AssigneeSelector
                     assignee={addIssueForm.assignee}
                     onChange={(newAssignee) =>
                        setAddIssueForm({ ...addIssueForm, assignee: newAssignee })
                     }
                  />
                  <ProjectSelector
                     project={addIssueForm.project}
                     onChange={(newProject) =>
                        setAddIssueForm({ ...addIssueForm, project: newProject })
                     }
                  />
                  <CycleSelector
                     cycle={teamCycles.find((c) => c.id === addIssueForm.cycleId)}
                     teamId={activeTeamId}
                     onChange={(newCycle) =>
                        setAddIssueForm({ ...addIssueForm, cycleId: newCycle?.id || '' })
                     }
                  />
                  <LabelSelector
                     selectedLabels={addIssueForm.labels}
                     onChange={(newLabels) =>
                        setAddIssueForm({ ...addIssueForm, labels: newLabels })
                     }
                  />
               </div>
            </div>
            <div className="flex items-center justify-between py-2.5 px-4 w-full border-t">
               <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                     <Switch
                        id="create-more"
                        checked={createMore}
                        onCheckedChange={setCreateMore}
                     />
                     <Label htmlFor="create-more">Create more</Label>
                  </div>
               </div>
               <Button
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => {
                     createIssue();
                  }}
               >
                  {isSubmitting ? 'Creating...' : 'Create issue'}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
