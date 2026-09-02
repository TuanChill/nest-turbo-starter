'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters';
import type { ColumnOption, FiltersState } from '@/components/data-table-filter/core/types';
import { multiOptionFilterFn, optionFilterFn } from '@/components/data-table-filter/lib/filter-fns';
import { cycleStatusLabel, type Cycle } from '@/mock-data/cycles';
import { Issue } from '@/mock-data/issues';
import { labels } from '@/mock-data/labels';
import { priorities } from '@/mock-data/priorities';
import { status, StatusCategory } from '@/mock-data/status';
import type { Project } from '@/mock-data/projects';
import { renderProjectIcon } from '@/lib/project-utils';
import type { Member } from '@/services/members.service';
import {
   BarChart3,
   CircleCheck,
   CircleDashed,
   CircleUserRound,
   Folder,
   RefreshCcw,
   Tag,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                Option lists                                */
/* -------------------------------------------------------------------------- */

const statusOptions: ColumnOption[] = status.map((item) => ({
   value: item.id,
   label: item.name,
   icon: <item.icon />,
}));

const STATUS_TYPES: { id: StatusCategory; name: string }[] = [
   { id: 'triage', name: 'Triage' },
   { id: 'backlog', name: 'Backlog' },
   { id: 'unstarted', name: 'Unstarted' },
   { id: 'started', name: 'Started' },
   { id: 'completed', name: 'Completed' },
   { id: 'canceled', name: 'Canceled' },
];

const statusTypeOptions: ColumnOption[] = STATUS_TYPES.map((item) => ({
   value: item.id,
   label: item.name,
   icon: <CircleDashed className="size-4 text-muted-foreground" />,
}));

const priorityOptions: ColumnOption[] = priorities.map((priority) => ({
   value: priority.id,
   label: priority.name,
   icon: <priority.icon className="size-4 text-muted-foreground" />,
}));

const labelOptions: ColumnOption[] = labels.map((label) => ({
   value: label.id,
   label: label.name,
   icon: <span className="size-2.5 rounded-full" style={{ backgroundColor: label.color }} />,
}));

function buildAssigneeOptions(members: Member[]): ColumnOption[] {
   return [
      {
         value: 'unassigned',
         label: 'Unassigned',
         icon: <CircleUserRound className="size-4 text-muted-foreground" />,
      },
      ...members.map((member) => ({
         value: member.id,
         label: member.name,
         icon: (
            <Avatar className="size-4">
               <AvatarImage src={member.avatarUrl} alt={member.name} />
               <AvatarFallback>{member.name[0]}</AvatarFallback>
            </Avatar>
         ),
      })),
   ];
}

function buildProjectOptions(projects: Project[]): ColumnOption[] {
   return projects.map((project) => ({
      value: project.id,
      label: project.name,
      icon: renderProjectIcon(project.icon, 'size-4 text-muted-foreground'),
   }));
}

function buildCycleOptions(cycles: Cycle[]): ColumnOption[] {
   return [
      {
         value: 'no-cycle',
         label: 'No cycle',
         icon: <RefreshCcw className="size-4 text-muted-foreground" />,
      },
      ...cycles.map((cycle) => ({
         value: cycle.id,
         label: `${cycle.name} (${cycleStatusLabel[cycle.status]})`,
         icon: <RefreshCcw className="size-4 text-muted-foreground" />,
      })),
   ];
}

/* -------------------------------------------------------------------------- */
/*                              Column definitions                            */
/* -------------------------------------------------------------------------- */

const dtf = createColumnConfigHelper<Issue>();

/**
 * Filterable issue columns for the bazza/ui data-table-filter component.
 * Accessors return the raw values the filter functions compare against;
 * `.options()` only feeds the option pickers, so pass live members/projects/
 * cycles to populate those with real data.
 */
export function buildIssueFilterColumns(
   members: Member[] = [],
   projects: Project[] = [],
   cycles: Cycle[] = []
) {
   return [
      dtf
         .option()
         .id('status')
         .accessor((issue: Issue) => issue.status.id)
         .displayName('Status')
         .icon(CircleCheck)
         .options(statusOptions)
         .build(),
      dtf
         .option()
         .id('statusType')
         .accessor((issue: Issue) => issue.status.category)
         .displayName('Status type')
         .icon(CircleDashed)
         .options(statusTypeOptions)
         .build(),
      dtf
         .option()
         .id('assignee')
         .accessor((issue: Issue) => issue.assignee?.id ?? 'unassigned')
         .displayName('Assignee')
         .icon(CircleUserRound)
         .options(buildAssigneeOptions(members))
         .build(),
      dtf
         .option()
         .id('priority')
         .accessor((issue: Issue) => issue.priority.id)
         .displayName('Priority')
         .icon(BarChart3)
         .options(priorityOptions)
         .build(),
      dtf
         .multiOption()
         .id('labels')
         .accessor((issue: Issue) => issue.labels.map((label) => label.id))
         .displayName('Labels')
         .icon(Tag)
         .options(labelOptions)
         .build(),
      dtf
         .option()
         .id('project')
         .accessor((issue: Issue) => issue.project?.id ?? '')
         .displayName('Project')
         .icon(Folder)
         .options(buildProjectOptions(projects))
         .build(),
      dtf
         .option()
         .id('cycle')
         .accessor((issue: Issue) => (issue.cycleId === '' ? 'no-cycle' : issue.cycleId))
         .displayName('Cycle')
         .icon(RefreshCcw)
         .options(buildCycleOptions(cycles))
         .build(),
   ] as const;
}

export const issueFilterColumns = buildIssueFilterColumns();

const columnById = new Map<string, (typeof issueFilterColumns)[number]>(
   issueFilterColumns.map((column) => [column.id, column])
);

/**
 * Applies a bazza/ui FiltersState to a list of issues, honoring the
 * operator of each filter (is / is not / include / exclude / …).
 */
export function applyIssueFilters(issues: Issue[], filters: FiltersState): Issue[] {
   if (filters.length === 0) return issues;

   return issues.filter((issue) =>
      filters.every((filter) => {
         const column = columnById.get(filter.columnId);
         if (!column) return true;

         const value = column.accessor(issue);
         switch (filter.type) {
            case 'option':
               return optionFilterFn(String(value ?? ''), filter) ?? true;
            case 'multiOption':
               return multiOptionFilterFn((value as string[]) ?? [], filter) ?? true;
            default:
               return true;
         }
      })
   );
}
