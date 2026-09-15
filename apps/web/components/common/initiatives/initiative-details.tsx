'use client';

import ProjectsTimeline from '@/components/common/projects/projects-timeline';
import { ProjectGroup } from '@/components/common/projects/projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
   countCompletedProjects,
   getInitiativeProjects,
   INITIATIVE_STATUS_META,
} from '@/lib/initiative-utils';
import { Initiative } from '@/services/initiatives.service';
import type { Project } from '@/services/projects.service';
import { useProjects } from '@/hooks/queries/use-projects-query';
import { usePostInitiativeUpdate } from '@/hooks/queries/use-initiatives-query';
import { Textarea } from '@/components/ui/textarea';
import { renderProjectIcon } from '@/lib/project-utils';
import { renderPriorityIcon } from '@/lib/priority-utils';
import { CalendarRange, ChevronDown, FilePenLine, FileText, Tag, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import { AddProjectToInitiativePopover } from './add-project-to-initiative-popover';
import { EditInitiativeDialog } from './edit-initiative-dialog';
import { InitiativeProgressPanel } from './initiative-progress-panel';
import { InitiativeStatusIcon } from './initiative-status-icon';

const TABS = ['overview', 'activity', 'projects'] as const;

const formatTarget = (iso: string): string => {
   const [, month, day] = iso.split('-').map(Number);
   const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
   ];
   return `${months[(month ?? 1) - 1]} ${day}`;
};

/* ------------------------------ projects table ---------------------------- */

const GROUP_ORDER: { key: string; label: string; match: (project: Project) => boolean }[] = [
   { key: 'in-progress', label: 'In Progress', match: (p) => p.status.category === 'started' },
   { key: 'planned', label: 'Planned', match: (p) => p.status.category === 'unstarted' },
   {
      key: 'backlog',
      label: 'Backlog',
      match: (p) => p.status.category === 'backlog' || p.status.category === 'triage',
   },
   { key: 'completed', label: 'Completed', match: (p) => p.status.category === 'completed' },
];

function ProjectsSection({ initiative }: { initiative: Initiative }) {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: liveProjects = [] } = useProjects();
   const projects = getInitiativeProjects(initiative, liveProjects);
   const groups = GROUP_ORDER.map((group) => ({
      ...group,
      projects: projects.filter(group.match),
   })).filter((group) => group.projects.length > 0);

   return (
      <section className="flex flex-col gap-2">
         <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Projects</h2>
            <AddProjectToInitiativePopover
               initiativeId={initiative.id}
               linkedProjectIds={initiative.projectIds}
            />
         </div>
         <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground border-b">
            <span className="flex-1">Name</span>
            <span className="hidden sm:block w-16 shrink-0">Health</span>
            <span className="hidden sm:block w-16 shrink-0">Priority</span>
            <span className="hidden md:block w-12 shrink-0">Lead</span>
            <span className="hidden md:block w-24 shrink-0">Target date</span>
            <span className="w-16 shrink-0">Status</span>
         </div>
         {groups.map((group) => (
            <div key={group.key} className="flex flex-col">
               <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
                  <ChevronDown className="size-3" />
                  {group.label}
                  <span className="flex-1 border-b border-border/60" />
               </div>
               {group.projects.map((project) => (
                  <Link
                     key={project.id}
                     href={`/${orgId}/project/${project.id}/overview`}
                     className="flex items-center gap-2 py-2 text-sm hover:bg-sidebar/50 rounded-md px-1 -mx-1 transition-colors"
                  >
                     {renderProjectIcon(project.icon, 'size-4 text-muted-foreground shrink-0')}
                     <span className="flex-1 truncate font-medium">{project.name}</span>
                     <span className="hidden sm:block w-16 shrink-0">
                        <span
                           className="size-2.5 rounded-full inline-block"
                           style={{ backgroundColor: project.health.color }}
                        />
                     </span>
                     <span className="hidden sm:block w-16 shrink-0">
                        {renderPriorityIcon(project.priority?.id, 'size-4 text-muted-foreground')}
                     </span>
                     <span className="hidden md:block w-12 shrink-0">
                        {project.lead ? (
                           <Avatar className="size-5">
                              <AvatarImage src={project.lead.avatarUrl} alt={project.lead.name} />
                              <AvatarFallback className="text-[9px]">
                                 {project.lead.name[0]}
                              </AvatarFallback>
                           </Avatar>
                        ) : (
                           <span className="text-xs text-muted-foreground">—</span>
                        )}
                     </span>
                     <span className="hidden md:flex items-center gap-1 w-24 shrink-0 text-xs text-muted-foreground">
                        {project.targetDate ? (
                           <>
                              <CalendarRange className="size-3.5" />
                              {formatTarget(project.targetDate)}
                           </>
                        ) : (
                           '—'
                        )}
                     </span>
                     <span className="w-16 shrink-0 text-xs text-muted-foreground">
                        {project.percentComplete}%
                     </span>
                  </Link>
               ))}
            </div>
         ))}
      </section>
   );
}

/* ------------------------------- overview tab ----------------------------- */

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
   return (
      <div className="flex items-center gap-2 text-sm">
         <span className="w-24 text-muted-foreground text-xs shrink-0">{label}</span>
         {children}
      </div>
   );
}

function Overview({ initiative }: { initiative: Initiative }) {
   const { data: liveProjects = [] } = useProjects();
   const postUpdate = usePostInitiativeUpdate();
   const [isUpdateEditorOpen, setIsUpdateEditorOpen] = useState(false);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [updateText, setUpdateText] = useState('');
   const [updateHealth, setUpdateHealth] = useState<
      'no-update' | 'on-track' | 'at-risk' | 'off-track'
   >('on-track');
   const completed = countCompletedProjects(initiative, liveProjects);
   const total = initiative.projectCount;

   const submitUpdate = async () => {
      const text = updateText.trim();
      if (!text) return;
      await postUpdate.mutateAsync({
         id: initiative.id,
         payload: {
            health: updateHealth,
            blocks: [{ type: 'paragraph', text }],
         },
      });
      setUpdateText('');
      setIsUpdateEditorOpen(false);
   };

   return (
      <div className="w-full h-full flex overflow-hidden">
         <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-6">
               <span className="inline-flex size-10 items-center justify-center rounded-md bg-muted/50 text-2xl">
                  {initiative.icon}
               </span>
               <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                     <h1 className="text-2xl font-semibold">{initiative.name}</h1>
                     <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
                        Edit initiative
                     </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                     {initiative.description ?? 'Add a short summary…'}
                  </p>
               </div>

               <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="text-muted-foreground text-xs w-24">Properties</span>
                  <span className="inline-flex items-center gap-1.5">
                     <InitiativeStatusIcon status={initiative.status} />
                     {INITIATIVE_STATUS_META[initiative.status].label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                     {renderPriorityIcon(initiative.priority?.id, 'size-4')}
                     {initiative.priority.name}
                  </span>
                  {initiative.owner ? (
                     <span className="inline-flex items-center gap-1.5">
                        <Avatar className="size-4">
                           <AvatarImage
                              src={initiative.owner.avatarUrl}
                              alt={initiative.owner.name}
                           />
                           <AvatarFallback className="text-[8px]">
                              {initiative.owner.name[0]}
                           </AvatarFallback>
                        </Avatar>
                        {initiative.owner.name}
                     </span>
                  ) : (
                     <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <UserRound className="size-4" /> Owner
                     </span>
                  )}
                  {initiative.target && (
                     <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CalendarRange className="size-4" />
                        {initiative.target}
                     </span>
                  )}
               </div>

               <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground text-xs w-24">Resources</span>
                  {initiative.resources?.length ? (
                     <div className="flex flex-wrap gap-2">
                        {initiative.resources.map((resource) => (
                           <a
                              key={`${resource.label}-${resource.url}`}
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                           >
                              {resource.label}
                           </a>
                        ))}
                     </div>
                  ) : (
                     <span className="text-muted-foreground">No resources</span>
                  )}
               </div>

               {isUpdateEditorOpen ? (
                  <div className="rounded-lg border p-3 space-y-3">
                     <Textarea
                        autoFocus
                        value={updateText}
                        onChange={(event) => setUpdateText(event.target.value)}
                        placeholder="Share an initiative update..."
                     />
                     <div className="flex items-center justify-between gap-2">
                        <select
                           value={updateHealth}
                           onChange={(event) =>
                              setUpdateHealth(event.target.value as typeof updateHealth)
                           }
                           className="h-8 rounded-md border bg-background px-2 text-xs"
                        >
                           <option value="on-track">On track</option>
                           <option value="at-risk">At risk</option>
                           <option value="off-track">Off track</option>
                           <option value="no-update">No update</option>
                        </select>
                        <div className="flex gap-2">
                           <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsUpdateEditorOpen(false)}
                           >
                              Cancel
                           </Button>
                           <Button
                              size="sm"
                              disabled={postUpdate.isPending || !updateText.trim()}
                              onClick={submitUpdate}
                           >
                              {postUpdate.isPending ? 'Posting...' : 'Post update'}
                           </Button>
                        </div>
                     </div>
                  </div>
               ) : (
                  <button
                     onClick={() => setIsUpdateEditorOpen(true)}
                     className="flex items-center justify-center gap-2 rounded-lg border py-4 text-sm text-muted-foreground hover:bg-accent/40 transition-colors"
                  >
                     <FilePenLine className="size-4" />
                     Write initiative update
                  </button>
               )}

               {initiative.updates?.length ? (
                  <div className="space-y-2">
                     <h2 className="text-sm font-medium">Recent updates</h2>
                     {initiative.updates.slice(0, 3).map((update) => (
                        <div key={update.id} className="rounded-lg border p-3 text-sm">
                           <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                 {update.author?.name ?? 'Member'} · {update.health}
                              </span>
                              <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                           </div>
                           <p className="mt-2 text-muted-foreground">
                              {update.blocks
                                 .filter((block): block is { text: string } =>
                                    Boolean(block && typeof block === 'object' && 'text' in block)
                                 )
                                 .map((block) => block.text)
                                 .join('\n')}
                           </p>
                        </div>
                     ))}
                  </div>
               ) : null}

               <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-medium">Description</h2>
                  <p className="text-sm text-muted-foreground">
                     {initiative.description ?? 'Add description…'}
                  </p>
               </div>

               <ProjectsSection initiative={initiative} />
               <EditInitiativeDialog
                  initiative={initiative}
                  open={isEditOpen}
                  onOpenChange={setIsEditOpen}
               />
            </div>
         </div>

         <aside className="hidden lg:flex flex-col w-80 shrink-0 border-l h-full overflow-y-auto p-5 gap-6 bg-container">
            <div className="flex flex-col gap-3">
               <span className="text-sm font-medium">Properties</span>
               <PropertyRow label="Status">
                  <span className="inline-flex items-center gap-1.5">
                     <InitiativeStatusIcon status={initiative.status} />
                     {INITIATIVE_STATUS_META[initiative.status].label}
                  </span>
               </PropertyRow>
               <PropertyRow label="Priority">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                     {renderPriorityIcon(initiative.priority?.id, 'size-4')}
                     {initiative.priority.name}
                  </span>
               </PropertyRow>
               <PropertyRow label="Owner">
                  {initiative.owner ? (
                     <span className="inline-flex items-center gap-1.5">
                        <Avatar className="size-4">
                           <AvatarImage
                              src={initiative.owner.avatarUrl}
                              alt={initiative.owner.name}
                           />
                           <AvatarFallback className="text-[8px]">
                              {initiative.owner.name[0]}
                           </AvatarFallback>
                        </Avatar>
                        {initiative.owner.name}
                     </span>
                  ) : (
                     <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <UserRound className="size-4" /> Add owner
                     </span>
                  )}
               </PropertyRow>
               <PropertyRow label="Target date">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                     <CalendarRange className="size-4" />
                     {initiative.target ?? 'Add target date'}
                  </span>
               </PropertyRow>
               <PropertyRow label="Labels">
                  {initiative.labels?.length ? (
                     <div className="flex flex-wrap gap-1.5">
                        {initiative.labels.map((label) => (
                           <span
                              key={label.id}
                              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                           >
                              <span
                                 className="size-2 rounded-full"
                                 style={{ backgroundColor: label.color }}
                              />
                              {label.name}
                           </span>
                        ))}
                     </div>
                  ) : (
                     <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <Tag className="size-4" /> No labels
                     </span>
                  )}
               </PropertyRow>
               <PropertyRow label="Projects">
                  <span className="text-muted-foreground text-xs">
                     {completed} / {total} completed
                  </span>
               </PropertyRow>
            </div>

            <InitiativeProgressPanel initiative={initiative} />

            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Activity</span>
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                     See all
                  </button>
               </div>
               <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  {initiative.activity?.slice(0, 3).map((event) => (
                     <span key={event.id} className="flex items-start gap-2">
                        <FileText className="size-3.5 mt-px shrink-0" />
                        {event.actor?.name ?? 'A member'} {event.event} this initiative ·{' '}
                        {new Date(event.createdAt).toLocaleDateString()}
                     </span>
                  ))}
                  {!initiative.activity?.length && <span>No activity yet.</span>}
               </div>
            </div>
         </aside>
      </div>
   );
}

/* ------------------------------- activity tab ----------------------------- */

function Activity({ initiative }: { initiative: Initiative }) {
   return (
      <div className="max-w-2xl mx-auto px-8 py-10 flex flex-col gap-4 w-full">
         <h2 className="text-lg font-medium">Activity</h2>
         <div className="flex flex-col">
            {initiative.activity?.length ? (
               initiative.activity.map((event) => (
                  <div
                     key={event.id}
                     className="flex items-center gap-3 py-3 border-b border-border/50 text-sm"
                  >
                     <FileText className="size-4 text-muted-foreground shrink-0" />
                     <span className="flex-1">
                        {event.actor?.name ?? 'A member'} {event.event} this initiative
                     </span>
                     <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString()}
                     </span>
                  </div>
               ))
            ) : (
               <p className="py-4 text-sm text-muted-foreground">No activity yet.</p>
            )}
         </div>
      </div>
   );
}

import { useInitiative } from '@/hooks/queries/use-initiatives-query';
import { Skeleton } from '@/components/ui/skeleton';

function InitiativeSkeleton() {
   return (
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-6 animate-in fade-in-50 duration-200">
         <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-md" />
            <div className="space-y-2 flex-1">
               <Skeleton className="h-7 w-2/3" />
               <Skeleton className="h-4 w-1/3" />
            </div>
         </div>
         <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
         </div>
         <div className="grid grid-cols-3 gap-4 pt-6">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
         </div>
      </div>
   );
}

/* ---------------------------------- export -------------------------------- */

/** Initiative detail page: Overview / Activity / Projects tabs. */
export default function InitiativeDetails({ initiativeId }: { initiativeId: string }) {
   const [tab] = useQueryState('tab', parseAsStringLiteral(TABS).withDefault('overview'));
   const { data: fetchedInitiative, isLoading } = useInitiative(initiativeId);
   const { data: liveProjects = [] } = useProjects();
   const { orgId } = useParams<{ orgId: string }>();

   const initiative = useMemo(() => fetchedInitiative, [fetchedInitiative]);

   const timelineGroups = useMemo<ProjectGroup[]>(() => {
      if (!initiative) return [];
      return [
         {
            id: initiative.id,
            name: initiative.name,
            icon: initiative.icon,
            projects: getInitiativeProjects(initiative, liveProjects),
         },
      ];
   }, [initiative, liveProjects]);

   if (isLoading) {
      return <InitiativeSkeleton />;
   }

   if (!initiative) {
      return (
         <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground animate-in fade-in-50 duration-200">
            <p className="text-base font-medium text-foreground">Initiative not found</p>
            <p className="text-xs text-muted-foreground">
               This initiative does not exist or has been removed.
            </p>
            <Link
               href={`/${orgId ?? 'lndev-ui'}/initiatives`}
               className="mt-2 text-xs px-3 py-1.5 rounded-md border border-border/80 bg-accent hover:bg-accent/80 transition-colors font-medium text-foreground"
            >
               Back to initiatives
            </Link>
         </div>
      );
   }

   if (tab === 'activity') return <Activity initiative={initiative} />;
   if (tab === 'projects') return <ProjectsTimeline groups={timelineGroups} />;
   return <Overview initiative={initiative} />;
}
