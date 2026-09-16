'use client';

import { FilterSelector } from '@/components/data-table-filter/components/filter-selector';
import QueryErrorState from '@/components/common/query-error-state';
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
   const membersQuery = useMembers();
   const projectsQuery = useProjects();
   const cyclesQuery = useCycles();
   const labelsQuery = useLabels('issue');
   const facetsQuery = useIssueFacets();
   const { data: members = [] } = membersQuery;
   const { data: projects = [] } = projectsQuery;
   const { data: cycles = [] } = cyclesQuery;
   const { data: labels = [] } = labelsQuery;
   const { data: facets } = facetsQuery;

   const failedQuery = [membersQuery, projectsQuery, cyclesQuery, labelsQuery, facetsQuery].find(
      (query) => query.isError
   );

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

   if (failedQuery) {
      return (
         <QueryErrorState
            subject="issue filter options"
            error={failedQuery.error}
            compact
            onRetry={() => void failedQuery.refetch()}
         />
      );
   }

   return (
      <FilterSelector columns={columns} filters={filters} actions={actions} strategy={strategy} />
   );
}
