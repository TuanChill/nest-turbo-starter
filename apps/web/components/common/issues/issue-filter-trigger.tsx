'use client';

import { FilterSelector } from '@/components/data-table-filter/components/filter-selector';
import { useDataTableFilters } from '@/components/data-table-filter/hooks/use-data-table-filters';
import { useCycles } from '@/hooks/queries/use-cycles-query';
import { useIssueFacets } from '@/hooks/queries/use-issues-query';
import { useLabels } from '@/hooks/queries/use-labels-query';
import { useMembers } from '@/hooks/queries/use-members-query';
import { useProjects } from '@/hooks/queries/use-projects-query';
import type { Issue } from '@/mock-data/issues';
import { useFilterStore } from '@/store/filter-store';
import { useMemo } from 'react';
import { buildIssueFilterColumns } from './issue-filter-columns';

/**
 * Standalone filter button for the issue header toolbars.
 *
 * Keep this selector on the same column contract as the applied-filter bar so
 * every supported issue field is reachable before a filter is active.
 */
export function IssueFilterTrigger() {
   const { filters, setFilters } = useFilterStore();
   const { data: members = [] } = useMembers();
   const { data: projects = [] } = useProjects();
   const { data: cycles = [] } = useCycles();
   const { data: labels = [] } = useLabels('issue');
   const { data: facets } = useIssueFacets();

   const columnsConfig = useMemo(
      () => buildIssueFilterColumns(members, projects, cycles, labels),
      [members, projects, cycles, labels]
   );

   const faceted = useMemo(
      () =>
         facets
            ? {
                 status: new Map(Object.entries(facets.status)),
                 statusType: new Map(Object.entries(facets.statusType)),
                 assignee: new Map(Object.entries(facets.assignee)),
                 priority: new Map(Object.entries(facets.priority)),
                 labels: new Map(Object.entries(facets.labels)),
                 project: new Map(Object.entries(facets.project)),
                 cycle: new Map(Object.entries(facets.cycle)),
              }
            : undefined,
      [facets]
   );

   const { columns, actions, strategy } = useDataTableFilters({
      strategy: 'server',
      data: [] as Issue[],
      columnsConfig,
      filters,
      onFiltersChange: setFilters,
      faceted,
   });

   return (
      <FilterSelector columns={columns} filters={filters} actions={actions} strategy={strategy} />
   );
}
