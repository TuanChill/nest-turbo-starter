'use client';

import { FilterSelector } from '@/components/data-table-filter/components/filter-selector';
import { useDataTableFilters } from '@/components/data-table-filter/hooks/use-data-table-filters';
import { useCycles } from '@/hooks/queries/use-cycles-query';
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

   const columnsConfig = useMemo(
      () => buildIssueFilterColumns(members, projects, cycles, labels),
      [members, projects, cycles, labels]
   );

   const { columns, actions, strategy } = useDataTableFilters({
      strategy: 'client',
      data: [] as Issue[],
      columnsConfig,
      filters,
      onFiltersChange: setFilters,
   });

   return (
      <FilterSelector columns={columns} filters={filters} actions={actions} strategy={strategy} />
   );
}
