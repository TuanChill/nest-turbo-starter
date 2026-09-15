'use client';

import { CapacityRing } from '@/components/common/cycles/capacity-ring';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Issue } from '@/mock-data/issues';
import type { ProjectDetail } from '@/mock-data/project-details';
import type { Project } from '@/mock-data/projects';
import type { LabelInterface } from '@/mock-data/labels';
import { useTeams } from '@/hooks/queries/use-teams-query';
import { useCycles } from '@/hooks/queries/use-cycles-query';
import { PanelFilterTarget, usePanelFilter } from '@/components/common/issues/use-panel-filter';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProjectProgressChart } from './project-progress-chart';
import { StatusSelector } from '../status-selector';
import { PrioritySelector } from '../priority-selector';
import { LeadSelector } from '../lead-selector';
import { DatePicker } from '../date-picker';
import { useUpdateProject, useToggleMilestone } from '@/hooks/queries/use-projects-query';
import { AddMilestonePopover } from '../add-milestone-popover';
import { ArrowRight, Calendar, Check, Compass, Slack } from 'lucide-react';
import { useMemo } from 'react';
import { LabelSelector } from '@/components/layout/sidebar/create-new-issue/label-selector';
import { ProjectMembersPicker } from '../project-members-picker';
import {
   DropdownMenu,
   DropdownMenuCheckboxItem,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectPropertiesPanelProps {
   project: Project;
   detail: ProjectDetail;
   issues: Issue[];
}

const isCompleted = (issue: Issue) => issue.status.category === 'completed';

const formatDay = (iso?: string) => (iso ? format(parseISO(iso), 'MMM do') : '—');

interface BreakdownRow {
   key: string;
   label: string;
   leading: React.ReactNode;
   total: number;
   completedPercent: number;
   /** Click-to-filter target (exclusive, like the insights panel rows). */
   target?: PanelFilterTarget;
}

function buildRows<T>(
   issues: Issue[],
   keyOf: (issue: Issue) => T | undefined,
   describe: (key: T, sample: Issue) => Omit<BreakdownRow, 'total' | 'completedPercent'>
): BreakdownRow[] {
   const buckets = new Map<T, Issue[]>();
   for (const issue of issues) {
      const key = keyOf(issue);
      if (key === undefined) continue;
      buckets.set(key, [...(buckets.get(key) ?? []), issue]);
   }
   return [...buckets.entries()]
      .map(([key, bucket]) => ({
         ...describe(key, bucket[0]),
         total: bucket.length,
         completedPercent: Math.round((bucket.filter(isCompleted).length / bucket.length) * 100),
      }))
      .sort((a, b) => b.total - a.total);
}

function BreakdownList({
   rows,
   panelFilter,
}: {
   rows: BreakdownRow[];
   panelFilter: ReturnType<typeof usePanelFilter>;
}) {
   if (rows.length === 0) {
      return <p className="text-xs text-muted-foreground px-1 py-3">Nothing to show yet.</p>;
   }
   return (
      <div className="flex flex-col">
         {rows.map((row) => {
            const active = row.target ? panelFilter.isActive(row.target) : false;
            return (
               <button
                  key={row.key}
                  type="button"
                  onClick={() => row.target && panelFilter.toggle(row.target)}
                  className={cn(
                     'flex items-center justify-between gap-3 py-2 px-1.5 -mx-1.5 rounded-md text-left transition-colors',
                     row.target && 'cursor-pointer hover:bg-accent/50',
                     active && 'bg-accent hover:bg-accent'
                  )}
               >
                  <div className="flex items-center gap-2 min-w-0">
                     {row.leading}
                     <span className="text-sm truncate">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground">
                     <CapacityRing value={row.completedPercent} color="#6771c5" />
                     <span className="whitespace-nowrap">
                        {row.completedPercent}% of {row.total}
                     </span>
                  </div>
               </button>
            );
         })}
      </div>
   );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
   return (
      <div className="flex items-center justify-between gap-4 min-h-7">
         <span className="text-sm text-muted-foreground shrink-0">{label}</span>
         <div className="flex items-center gap-1.5 text-sm min-w-0">{children}</div>
      </div>
   );
}

/**
 * Right-side panel of the project pages: properties, milestones,
 * progress breakdowns and a compact activity feed.
 */
export function ProjectPropertiesPanel({ project, detail, issues }: ProjectPropertiesPanelProps) {
   const { orgId } = useParams<{ orgId: string }>();
   const panelFilter = usePanelFilter();
   const completed = issues.filter(isCompleted).length;

   const { data: teams = [] } = useTeams();
   const { data: cycles = [] } = useCycles(project.teamId);
   const projectTeamIds = project.teamIds ?? [project.teamId];

   const updateProjectMutation = useUpdateProject();
   const { mutate: toggleMilestone } = useToggleMilestone();
   const handleStatusChange = (statusId: string) => {
      updateProjectMutation.mutate({
         id: project.id,
         payload: { statusId } as unknown as Partial<Project>,
      });
   };
   const handlePriorityChange = (priorityId: string) => {
      updateProjectMutation.mutate({
         id: project.id,
         payload: { priorityId } as unknown as Partial<Project>,
      });
   };
   const handleLeadChange = (leadId: string) => {
      updateProjectMutation.mutate({
         id: project.id,
         payload: { leadId } as unknown as Partial<Project>,
      });
   };
   const handleTargetDateChange = (date: Date | undefined) => {
      updateProjectMutation.mutate({
         id: project.id,
         payload: {
            targetDate: date ? format(date, 'yyyy-MM-dd') : undefined,
         } as unknown as Partial<Project>,
      });
   };
   const handleLabelsChange = (newLabels: LabelInterface[]) => {
      updateProjectMutation.mutate({
         id: project.id,
         payload: { labelIds: newLabels.map((label) => label.id) } as unknown as Partial<Project>,
      });
   };
   const handleTeamsChange = (teamId: string, checked: boolean) => {
      if (teamId === project.teamId && !checked) return;
      const nextTeamIds = checked
         ? [...new Set([...projectTeamIds, teamId])]
         : projectTeamIds.filter((id) => id !== teamId);
      updateProjectMutation.mutate({
         id: project.id,
         payload: { teamIds: nextTeamIds } as unknown as Partial<Project>,
      });
   };

   const started = issues.filter((issue) => issue.status.category === 'started').length;

   const assigneeRows = useMemo(
      () =>
         buildRows(
            issues,
            (issue) => issue.assignee?.id ?? 'no-assignee',
            (key, sample) =>
               sample.assignee
                  ? {
                       key: String(key),
                       label: sample.assignee.name,
                       leading: (
                          <Avatar className="size-5 shrink-0">
                             <AvatarImage
                                src={sample.assignee.avatarUrl}
                                alt={sample.assignee.name}
                             />
                             <AvatarFallback>{sample.assignee.name[0]}</AvatarFallback>
                          </Avatar>
                       ),
                       target: { columnId: 'assignee', value: sample.assignee.id },
                    }
                  : {
                       key: 'no-assignee',
                       label: 'No assignee',
                       leading: null,
                       target: { columnId: 'assignee', value: 'unassigned' },
                    }
         ),
      [issues]
   );

   const labelRows = useMemo(
      () =>
         buildRows(
            issues,
            (issue) => issue.labels[0]?.id,
            (key, sample) => ({
               key: String(key),
               label: sample.labels[0]?.name ?? 'Unlabeled',
               leading: (
                  <span
                     className="size-2.5 rounded-full shrink-0"
                     style={{ backgroundColor: sample.labels[0]?.color ?? 'gray' }}
                  />
               ),
               target: { columnId: 'labels', value: String(key) },
            })
         ),
      [issues]
   );

   const cycleRows = useMemo(
      () =>
         buildRows(
            issues,
            (issue) => (issue.cycleId === '' ? undefined : issue.cycleId),
            (key) => ({
               key: String(key),
               label: cycles.find((cycle) => cycle.id === String(key))?.name ?? `Cycle ${key}`,
               leading: null,
               target: { columnId: 'cycle', value: String(key) },
            })
         ),
      [issues, cycles]
   );

   return (
      <div className="flex flex-col h-full w-full overflow-y-auto">
         {/* Properties */}
         <div className="px-5 pt-4 pb-4 border-b">
            <h3 className="text-sm font-medium mb-2.5">Properties</h3>
            <div className="flex flex-col gap-1">
               <PropertyRow label="Status">
                  <StatusSelector status={project.status} onStatusChange={handleStatusChange} />
               </PropertyRow>
               <PropertyRow label="Priority">
                  <PrioritySelector
                     priority={project.priority}
                     onPriorityChange={handlePriorityChange}
                     showLabel
                  />
               </PropertyRow>
               <PropertyRow label="Lead">
                  <LeadSelector lead={project.lead} onLeadChange={handleLeadChange} />
               </PropertyRow>
               <PropertyRow label="Members">
                  <ProjectMembersPicker projectId={project.id} fallbackMembers={project.members} />
               </PropertyRow>
               <PropertyRow label="Dates">
                  <span className="inline-flex items-center gap-1">
                     <Calendar className="size-3.5 text-muted-foreground" />
                     {formatDay(project.startDate)}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <DatePicker
                     date={project.targetDate ? new Date(project.targetDate) : undefined}
                     onDateChange={handleTargetDateChange}
                  />
               </PropertyRow>
               <PropertyRow label="Teams">
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <button
                           type="button"
                           className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-accent/50"
                        >
                           <span className="flex items-center gap-1.5 min-w-0">
                              {projectTeamIds.slice(0, 2).map((id) => {
                                 const projectTeam = teams.find((candidate) => candidate.id === id);
                                 return (
                                    <span key={id} className="inline-flex items-center gap-1">
                                       {projectTeam?.icon}
                                       <span className="max-w-20 truncate">
                                          {projectTeam?.name ?? id}
                                       </span>
                                    </span>
                                 );
                              })}
                              {projectTeamIds.length > 2 && (
                                 <span className="text-muted-foreground">
                                    +{projectTeamIds.length - 2}
                                 </span>
                              )}
                           </span>
                        </button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Select project teams</DropdownMenuLabel>
                        {teams.map((candidate) => (
                           <DropdownMenuCheckboxItem
                              key={candidate.id}
                              checked={projectTeamIds.includes(candidate.id)}
                              disabled={
                                 candidate.id === project.teamId || updateProjectMutation.isPending
                              }
                              onCheckedChange={(checked) =>
                                 handleTeamsChange(candidate.id, checked === true)
                              }
                           >
                              <span className="mr-2">{candidate.icon}</span>
                              {candidate.name}
                           </DropdownMenuCheckboxItem>
                        ))}
                     </DropdownMenuContent>
                  </DropdownMenu>
               </PropertyRow>
               <PropertyRow label="Slack">
                  <span
                     className="flex items-center gap-1.5 text-muted-foreground"
                     title="Slack integration is not configured"
                  >
                     <Slack className="size-3.5" />
                     Unavailable
                  </span>
               </PropertyRow>
               <PropertyRow label="Initiatives">
                  {project.initiative ? (
                     <span className="truncate max-w-44">{project.initiative}</span>
                  ) : (
                     <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Compass className="size-3.5" />
                        No initiative
                     </span>
                  )}
               </PropertyRow>
               <PropertyRow label="Labels">
                  <div className="flex items-center gap-1.5">
                     {project.labels.map((label) => (
                        <span
                           key={label.id}
                           className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5"
                        >
                           <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: label.color }}
                           />
                           {label.name}
                        </span>
                     ))}
                     {project.labels.length === 0 && (
                        <span className="text-xs text-muted-foreground">Add label</span>
                     )}
                     <LabelSelector
                        selectedLabels={project.labels}
                        onChange={handleLabelsChange}
                        showCounts={false}
                        allowCreate
                        scope="project"
                     />
                  </div>
               </PropertyRow>
            </div>
         </div>

         {/* Milestones */}
         <div className="px-5 py-4 border-b">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-medium">Milestones</h3>
               <AddMilestonePopover projectId={project.id} />
            </div>
            {detail.milestones.length === 0 ? (
               <p className="text-xs text-muted-foreground">
                  Add milestones to organize work within your project and break it into more
                  granular stages.
               </p>
            ) : (
               <div className="flex flex-col gap-1.5">
                  {detail.milestones.map((milestone) => (
                     <button
                        key={milestone.id}
                        onClick={() =>
                           toggleMilestone({ projectId: project.id, milestoneId: milestone.id })
                        }
                        className="flex items-center justify-between gap-2 text-sm text-left hover:bg-accent/50 rounded px-1 -mx-1"
                     >
                        <span className="flex items-center gap-2 min-w-0">
                           <span
                              className={
                                 milestone.completed
                                    ? 'size-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0'
                                    : 'size-4 rounded-full border border-muted-foreground/40 shrink-0'
                              }
                           >
                              {milestone.completed && <Check className="size-2.5 text-white" />}
                           </span>
                           <span
                              className={
                                 milestone.completed
                                    ? 'truncate line-through text-muted-foreground'
                                    : 'truncate'
                              }
                           >
                              {milestone.name}
                           </span>
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                           {formatDay(milestone.targetDate)}
                        </span>
                     </button>
                  ))}
               </div>
            )}
         </div>

         {/* Progress */}
         <div className="px-5 py-4 border-b">
            <h3 className="text-sm font-medium mb-3">Progress</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <span className="size-2 rounded-[2px] bg-[#8f9299]" />
                     Scope
                  </div>
                  <span className="text-sm font-medium">{issues.length}</span>
               </div>
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <span className="size-2 rounded-[2px] bg-[#facc15]" />
                     Started
                  </div>
                  <span className="text-sm font-medium">{started}</span>
               </div>
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <span className="size-2 rounded-[2px] bg-[#6771c5]" />
                     Completed
                  </div>
                  <span className="text-sm font-medium">{completed}</span>
               </div>
            </div>
            <div className="mb-3">
               <ProjectProgressChart
                  startDate={project.startDate}
                  endDate={project.targetDate ?? project.startDate}
                  scope={issues.length}
                  started={started}
                  completed={completed}
               />
            </div>
            <Tabs defaultValue="assignees">
               <TabsList className="h-8 bg-transparent gap-1 p-0">
                  <TabsTrigger value="assignees" className="text-xs px-2.5 rounded-full">
                     Assignees
                  </TabsTrigger>
                  <TabsTrigger value="labels" className="text-xs px-2.5 rounded-full">
                     Labels
                  </TabsTrigger>
                  <TabsTrigger value="cycles" className="text-xs px-2.5 rounded-full">
                     Cycles
                  </TabsTrigger>
               </TabsList>
               <TabsContent value="assignees">
                  <BreakdownList rows={assigneeRows} panelFilter={panelFilter} />
               </TabsContent>
               <TabsContent value="labels">
                  <BreakdownList rows={labelRows} panelFilter={panelFilter} />
               </TabsContent>
               <TabsContent value="cycles">
                  <BreakdownList rows={cycleRows} panelFilter={panelFilter} />
               </TabsContent>
            </Tabs>
         </div>

         {/* Activity */}
         <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-medium">Activity</h3>
               <Link
                  href={`/${orgId}/project/${project.id}/activity`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
               >
                  See all
               </Link>
            </div>
            <div className="flex flex-col gap-3">
               {detail.activity.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 text-xs">
                     {event.user ? (
                        <Avatar className="size-4 mt-0.5 shrink-0">
                           <AvatarImage src={event.user.avatarUrl} alt={event.user.name} />
                           <AvatarFallback>{event.user.name[0]}</AvatarFallback>
                        </Avatar>
                     ) : (
                        <span
                           className="size-4 mt-0.5 rounded-full bg-muted shrink-0"
                           aria-hidden="true"
                        />
                     )}
                     <p className="text-muted-foreground leading-relaxed">
                        <span className="text-foreground">
                           {event.user?.name ?? 'Unknown member'}
                        </span>{' '}
                        {event.text} · {formatDay(event.date)}
                     </p>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
